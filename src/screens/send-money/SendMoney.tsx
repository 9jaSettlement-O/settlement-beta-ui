import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressStepper } from "@/components/ui/progress";
import { QuickActionSendBox } from "@/components/wallets/QuickActionSendBox";
import { ReviewDetailsCard } from "@/components/send-money/ReviewDetailsCard";
import { useWalletStore } from "@/store/wallet.store";
import {
  getDashboard,
  getRates,
  convertWithRate,
  persistWalletsForMock,
} from "@/services/wallet-service";
import {
  getBanks,
  getBeneficiaries,
  accountLookup,
  sendMoney,
} from "@/services/send-money-service";
import { formatAmountWithCurrency } from "@/lib/utils/currency.util";
import type {
  Rate,
  Beneficiary,
  SendMoneyPayload,
} from "@/types/wallet.types";

const STEPS = [
  { id: "amount", label: "Amount" },
  { id: "recipient", label: "Recipient" },
  { id: "review", label: "Review" },
];

export default function SendMoney() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { wallets, selectedWallet, setSelectedWallet, hydrateFromDashboard } =
    useWalletStore();

  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [receiveCountryCode, setReceiveCountryCode] = useState<string>("");
  const [useExisting, setUseExisting] = useState(false);
  const [existingBeneficiary, setExistingBeneficiary] = useState<Beneficiary | null>(null);
  const [receiverName, setReceiverName] = useState("");
  const [receiverAccount, setReceiverAccount] = useState("");
  const [receiverBankCode, setReceiverBankCode] = useState("");
  const [receiverBankName, setReceiverBankName] = useState("");
  const [description, setDescription] = useState("");

  const { data: dashboardData } = useApiQuery({
    queryKey: ["dashboard", "wallets"],
    queryFn: async () => {
      const res = await getDashboard();
      if (!res.succeeded || !res.data) throw new Error(res.msg);
      if (res.data.wallets?.length) persistWalletsForMock(res.data.wallets);
      return res.data;
    },
    enabled: true,
  });

  const { data: rates = [] } = useApiQuery({
    queryKey: ["rates"],
    queryFn: async () => {
      const res = await getRates();
      if (!res.succeeded) throw new Error(res.msg);
      return res.data;
    },
    enabled: true,
  });

  const sourceWallet = selectedWallet ?? wallets[0] ?? null;
  const receivingOptions = useMemo(() => {
    if (!sourceWallet || !rates.length) return [];
    return rates
      .filter((r) => r.sending_country.code === sourceWallet.country.code)
      .map((r) => ({ code: r.receiving_country.code, currency: r.receiving_country.currency_code }));
  }, [sourceWallet, rates]);

  const effectiveReceiveCode = receiveCountryCode || receivingOptions[0]?.code || "";
  const rate: Rate | null = useMemo(() => {
    if (!sourceWallet || !effectiveReceiveCode || !rates.length) return null;
    return (
      rates.find(
        (r) =>
          r.sending_country.code === sourceWallet.country.code &&
          r.receiving_country.code === effectiveReceiveCode
      ) ?? null
    );
  }, [sourceWallet, effectiveReceiveCode, rates]);

  const recipientGets = useMemo(() => {
    if (!rate || amount <= 0) return 0;
    return convertWithRate(rate, amount);
  }, [rate, amount]);

  const { data: banks = [] } = useApiQuery({
    queryKey: ["banks", effectiveReceiveCode],
    queryFn: async () => {
      const res = await getBanks(effectiveReceiveCode);
      if (!res.succeeded) return [];
      return res.data;
    },
    enabled: step >= 2 && effectiveReceiveCode === "NG",
  });

  const { data: beneficiaries = [] } = useApiQuery({
    queryKey: ["beneficiaries"],
    queryFn: async () => {
      const res = await getBeneficiaries();
      if (!res.succeeded) return [];
      return res.data;
    },
    enabled: step >= 2,
  });

  const sendMutation = useApiMutation({
    mutationFn: async (payload: SendMoneyPayload) => {
      const res = await sendMoney(payload);
      if (!res.succeeded) throw new Error(res.message);
      return res;
    },
    mockService: (payload) => sendMoney(payload),
    showErrorToast: true,
    showSuccessToast: true,
    successMessage: "Transfer initiated successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "wallets"] });
      setSuccess(true);
    },
  });

  useEffect(() => {
    if (dashboardData?.wallets?.length) hydrateFromDashboard(dashboardData.wallets);
  }, [dashboardData, hydrateFromDashboard]);

  useEffect(() => {
    if (receivingOptions.length && !receiveCountryCode)
      setReceiveCountryCode(receivingOptions[0].code);
  }, [receivingOptions, receiveCountryCode]);

  const canContinueStep1 =
    sourceWallet &&
    amount > 0 &&
    parseFloat(sourceWallet.available_balance) >= amount &&
    rate !== null;

  const resolvedRecipientName = useExisting && existingBeneficiary
    ? existingBeneficiary.receiver_name
    : receiverName;
  const resolvedRecipientAccount = useExisting && existingBeneficiary
    ? existingBeneficiary.receiver_id
    : receiverAccount;
  const resolvedRecipientBank = useExisting && existingBeneficiary
    ? existingBeneficiary.receiver_bank
    : receiverBankName;

  const canContinueStep2 =
    (useExisting && existingBeneficiary) ||
    (receiverName.trim() && receiverAccount.trim() && (effectiveReceiveCode !== "NG" || receiverBankCode));

  const handleLookup = async () => {
    if (!receiverAccount.trim() || !receiverBankCode) return;
    const res = await accountLookup(receiverAccount.trim(), receiverBankCode);
    if (res.succeeded && res.data) {
      setReceiverName(res.data.account_name);
    }
  };

  const handleSend = () => {
    if (!sourceWallet) return;
    const payload: SendMoneyPayload = {
      amount,
      source_wallet: sourceWallet.id,
      platform: "web",
      note: note || undefined,
      description: description || undefined,
    };
    if (useExisting && existingBeneficiary) {
      payload.beneficiary = existingBeneficiary.id;
      payload.receiver_name = existingBeneficiary.receiver_name;
      payload.receiver_account = existingBeneficiary.receiver_id;
      payload.receiver_bank_code = existingBeneficiary.receiver_bank_code;
    } else {
      payload.receiver_name = receiverName;
      payload.receiver_account = receiverAccount;
      if (receiverBankCode) payload.receiver_bank_code = receiverBankCode;
    }
    sendMutation.mutate(payload);
  };

  if (success) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-center">Transfer initiated</CardTitle>
            <CardContent className="pt-2 text-center text-muted-foreground">
              Your transfer has been submitted. You will receive a confirmation shortly.
            </CardContent>
          </CardHeader>
          <CardContent className="pt-0">
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressSteps = STEPS.map((s, i) => ({
    id: s.id,
    label: s.label,
    completed: step > i + 1,
    current: step === i + 1,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-lg px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step === 1 ? navigate("/dashboard") : setStep((s) => s - 1))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Send Money</h1>
            <p className="text-sm text-muted-foreground">
              Send money to friends and family at low fees
            </p>
          </div>
        </div>

        <ProgressStepper steps={progressSteps} className="mb-8" />

        {step === 1 && (
          <div className="space-y-6">
            <QuickActionSendBox
              label="You send"
              wallet={sourceWallet!}
              wallets={wallets}
              onWalletChange={setSelectedWallet}
              amount={amount}
              onAmountChange={setAmount}
              showLimits
            />
            {receivingOptions.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <Label className="text-muted-foreground">Recipient gets</Label>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {rate && amount > 0
                      ? formatAmountWithCurrency(
                          recipientGets,
                          receivingOptions.find((o) => o.code === effectiveReceiveCode)?.currency ?? "NGN"
                        )
                      : "—"}
                  </span>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={effectiveReceiveCode}
                    onChange={(e) => setReceiveCountryCode(e.target.value)}
                  >
                    {receivingOptions.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.currency}
                      </option>
                    ))}
                  </select>
                </div>
                {rate && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    1 {sourceWallet?.country.currency_code} = {rate.rate} {receivingOptions.find((o) => o.code === effectiveReceiveCode)?.currency}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Note (optional)</Label>
              <Input
                className="mt-2"
                placeholder="e.g. Payment for..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recipient details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useExisting"
                    checked={useExisting}
                    onChange={(e) => {
                      setUseExisting(e.target.checked);
                      if (!e.target.checked) setExistingBeneficiary(null);
                    }}
                    className="rounded border-input"
                  />
                  <Label htmlFor="useExisting" className="cursor-pointer">
                    Send to existing beneficiary
                  </Label>
                </div>
                {useExisting ? (
                  <div>
                    <Label className="text-muted-foreground">Choose beneficiary</Label>
                    <select
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={existingBeneficiary?.id ?? ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setExistingBeneficiary(beneficiaries.find((b) => b.id === id) ?? null);
                      }}
                    >
                      <option value="">Select...</option>
                      {beneficiaries.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.receiver_name} – {b.receiver_id}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    {effectiveReceiveCode === "NG" && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">Bank name</Label>
                          <select
                            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={receiverBankCode}
                            onChange={(e) => {
                              const bank = banks.find((b) => b.code === e.target.value);
                              setReceiverBankCode(e.target.value);
                              setReceiverBankName(bank?.name ?? "");
                            }}
                          >
                            <option value="">Select bank...</option>
                            {banks.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Account number</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder="10 digits"
                              value={receiverAccount}
                              onChange={(e) => {
                                setReceiverAccount(e.target.value.replace(/\D/g, "").slice(0, 10));
                              }}
                              maxLength={10}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleLookup}
                              disabled={receiverAccount.length !== 10 || !receiverBankCode}
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Account name</Label>
                          <Input
                            className="mt-2"
                            placeholder="From verification or enter manually"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    {effectiveReceiveCode !== "NG" && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">Recipient name</Label>
                          <Input
                            className="mt-2"
                            placeholder="Full name"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Email or account</Label>
                          <Input
                            className="mt-2"
                            placeholder="Email or account ID"
                            value={receiverAccount}
                            onChange={(e) => setReceiverAccount(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
                <div>
                  <Label className="text-muted-foreground">Description (optional)</Label>
                  <textarea
                    className="mt-2 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Purpose of transfer..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-muted bg-muted/20">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Send amount</span>
                    <span>{sourceWallet && formatAmountWithCurrency(amount, sourceWallet.country.currency_code)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees</span>
                    <span>{sourceWallet && formatAmountWithCurrency(0, sourceWallet.country.currency_code)}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{sourceWallet && formatAmountWithCurrency(amount, sourceWallet.country.currency_code)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button
              className="w-full"
              size="lg"
              disabled={!canContinueStep2}
              onClick={() => setStep(3)}
            >
              Continue to review
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <ReviewDetailsCard
              amount={amount}
              sourceWallet={sourceWallet!}
              recipientName={resolvedRecipientName}
              recipientAccount={resolvedRecipientAccount}
              recipientBank={resolvedRecipientBank}
              currencyCode={sourceWallet?.country.currency_code ?? ""}
            />
            <Button
              className="w-full"
              size="lg"
              loading={sendMutation.isPending}
              disabled={sendMutation.isPending}
              onClick={handleSend}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Money
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
