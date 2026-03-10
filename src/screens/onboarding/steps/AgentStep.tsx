/**
 * Agent KYC step: agent biodata → init KYC → poll status.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useKycStore } from "@/store/kyc.store";
import { submitAgentBiodata, initKyc, getKycStatus } from "@/services/kyc.service";
import { parseApiError } from "@/utils/parseApiError";

interface AgentForm {
  uniqueAgentId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  country: string;
  state: string;
  address: string;
}

const initialForm: AgentForm = {
  uniqueAgentId: "",
  firstName: "",
  lastName: "",
  middleName: "",
  dateOfBirth: "",
  country: "",
  state: "",
  address: "",
};

export default function AgentStep() {
  const { prevStep, setLoading, setError, loading, error } = useOnboardingStore();
  const { kycStatus, polling, startPolling, stopPolling } = useKycStore();
  const [form, setForm] = useState<AgentForm>(initialForm);

  const handleSubmit = async () => {
    if (!form.uniqueAgentId.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.country.trim()) {
      setError("Please fill required fields: agent ID, first name, last name, date of birth, country.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitAgentBiodata({
        uniqueAgentId: form.uniqueAgentId.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || undefined,
        dateOfBirth: form.dateOfBirth,
        country: form.country.trim(),
        state: form.state.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      await initKyc();
      startPolling(async () => {
        const res = await getKycStatus();
        return { kyc: res.status };
      });
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const isTerminal = kycStatus === "APPROVED" || kycStatus === "REJECTED";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Agent details</h2>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uniqueAgentId">Unique agent ID *</Label>
            <Input
              id="uniqueAgentId"
              value={form.uniqueAgentId}
              onChange={(e) => setForm((f) => ({ ...f, uniqueAgentId: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle name</Label>
            <Input
              id="middleName"
              value={form.middleName}
              onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {polling && (
        <p className="text-sm text-muted-foreground">
          Status: {kycStatus ?? "Checking…"}
        </p>
      )}
      {isTerminal && (
        <p className="text-sm font-medium">
          {kycStatus === "APPROVED" ? "Verification approved." : "Verification was not approved."}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { stopPolling(); prevStep(); }} disabled={loading}>
          Back
        </Button>
        {!isTerminal && (
          <Button onClick={handleSubmit} disabled={loading || polling}>
            {loading ? "Submitting…" : polling ? "Verifying…" : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}
