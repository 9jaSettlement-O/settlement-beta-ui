/**
 * Send Money service – mock implementation (same paradigm as onboarding-service / wallet-service).
 * Consumes a different JAVA API when available.
 */

import storage from "@/utils/storage.util";
import { STORAGE_KEYS } from "@/lib/constants";
import logger from "@/utils/logger.util";
import type {
  Bank,
  Beneficiary,
  SendMoneyPayload,
  SendMoneyResponse,
} from "@/types/wallet.types";
import { getDashboard } from "./wallet-service";

const MOCK_API_DELAY = 600;

const MOCK_BANKS_NG: Bank[] = [
  { code: "044", name: "Access Bank" },
  { code: "063", name: "Access Bank (Diamond)" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "084", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "058", name: "GTBank" },
  { code: "011", name: "First Bank of Nigeria" },
];

const MOCK_BENEFICIARIES_KEY = "send_money_beneficiaries_mock";

function getStoredBeneficiaries(): Beneficiary[] {
  const raw = storage.fetch(MOCK_BENEFICIARIES_KEY);
  return Array.isArray(raw) ? raw : [];
}

/**
 * Fetch banks for a country (e.g. NGN for Nigeria).
 */
export async function getBanks(countryCode: string): Promise<{
  succeeded: boolean;
  data: Bank[];
  message?: string;
}> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));
    const data = countryCode.toUpperCase() === "NG" ? MOCK_BANKS_NG : [];
    logger.debug("Mock: Banks loaded", { countryCode, count: data.length });
    return { succeeded: true, data };
  } catch (e) {
    logger.error("Error loading banks", e instanceof Error ? e : new Error(String(e)));
    return { succeeded: false, data: [] };
  }
}

/**
 * Fetch user's saved beneficiaries.
 */
export async function getBeneficiaries(): Promise<{
  succeeded: boolean;
  data: Beneficiary[];
  message?: string;
}> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));
    const data = getStoredBeneficiaries();
    logger.debug("Mock: Beneficiaries loaded", { count: data.length });
    return { succeeded: true, data };
  } catch (e) {
    logger.error("Error loading beneficiaries", e instanceof Error ? e : new Error(String(e)));
    return { succeeded: false, data: [] };
  }
}

/**
 * Account lookup (resolve account number + bank to account name).
 */
export async function accountLookup(
  accountNumber: string,
  bankCode: string
): Promise<{
  succeeded: boolean;
  data?: { account_number: string; account_name: string; account_bank?: string };
  message?: string;
}> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));
    const trimmed = accountNumber.replace(/\s/g, "");
    if (trimmed.length < 10) {
      return { succeeded: false, message: "Invalid account number" };
    }
    const bank = MOCK_BANKS_NG.find((b) => b.code === bankCode);
    const account_name = bank
      ? `Mock Account ${trimmed.slice(-4)}`
      : "Mock Account Holder";
    logger.debug("Mock: Account lookup", { accountNumber, bankCode });
    return {
      succeeded: true,
      data: {
        account_number: trimmed,
        account_name,
        account_bank: bankCode,
      },
    };
  } catch (e) {
    logger.error("Error during account lookup", e instanceof Error ? e : new Error(String(e)));
    return { succeeded: false };
  }
}

/**
 * Submit send money (mock). Deducts from wallet in stored dashboard mock.
 */
export async function sendMoney(payload: SendMoneyPayload): Promise<SendMoneyResponse> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));

    const amount = payload.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount");
    }

    const dashRes = await getDashboard();
    if (!dashRes.succeeded || !dashRes.data?.wallets?.length) {
      throw new Error("Unable to load wallet");
    }

    const wallets = dashRes.data.wallets;
    const sourceWallet = wallets.find((w) => w.id === payload.source_wallet);
    if (!sourceWallet) {
      throw new Error("Source wallet not found");
    }

    const balance = parseFloat(sourceWallet.available_balance);
    if (balance < amount) {
      throw new Error("Insufficient balance in source wallet");
    }

    const newWallets = wallets.map((w) =>
      w.id === payload.source_wallet
        ? {
            ...w,
            available_balance: (balance - amount).toFixed(2),
            total_balance: (parseFloat(w.total_balance) - amount).toFixed(2),
          }
        : w
    );
    storage.keep(STORAGE_KEYS.WALLETS_DASHBOARD_MOCK, { wallets: newWallets });

    const reference = `TXN${Date.now()}`;
    logger.info("Mock: Send money", { reference, amount, source_wallet: payload.source_wallet });

    return {
      succeeded: true,
      message: "Transfer initiated successfully",
      data: {
        reference,
        amount: String(amount),
        currency: sourceWallet.country.currency_code,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Transfer failed. Please try again.";
    logger.error("Send money failed", error instanceof Error ? error : new Error(String(error)));
    return {
      succeeded: false,
      message: msg,
      errors: { non_field_errors: [msg] },
    };
  }
}
