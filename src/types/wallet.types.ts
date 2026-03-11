/**
 * Wallet and currency conversion types
 * Aligned with mobile app (Wallet, Country, Rate/Dashboard responses).
 */

export interface Country {
  name: string;
  code: string;
  currency_code: string;
  minimum_send_amount: string;
  maximum_send_amount: string;
  payment_gateway?: string;
}

export interface Wallet {
  id: number;
  available_balance: string;
  total_balance: string;
  country: Country;
  limit?: unknown;
}

export interface RateCountry {
  name: string;
  code: string;
  currency_code: string;
  minimum_send_amount: string;
  maximum_send_amount: string;
}

export interface Rate {
  id: number;
  sending_country: RateCountry;
  receiving_country: RateCountry;
  rate: string;
  fee: string;
  fee_type: string;
  flat_fee: string;
  is_active: boolean;
  operator_type: "multiply" | "divide";
}

export interface DashboardData {
  wallets: Wallet[];
  transactions?: TransactionSummary[];
}

export interface TransactionSummary {
  id: number;
  type: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

export interface ConvertMoneyRequest {
  amount: string;
  rate_id: string;
  platform: string;
}

export interface ConvertMoneyResponse {
  succeeded: boolean;
  message: string;
  data?: { id: string; amount: string; currency: string };
  errors?: { [key: string]: string[] };
}

/** API-style response for dashboard (wallets + transactions) */
export interface DashboardResponse {
  succeeded: boolean;
  msg: string;
  data?: DashboardData;
  errors?: unknown;
}

/** API-style response for rates */
export interface RatesResponse {
  succeeded: boolean;
  msg: string;
  data: Rate[];
  errors?: unknown;
}

// --- Send Money ---

export interface Bank {
  code: string;
  name: string;
}

export interface Beneficiary {
  id: number;
  receiver_id: string;   // account number or email
  receiver_name: string;
  receiver_bank?: string;
  receiver_bank_code?: string;
}

export interface SendMoneyAmountState {
  amount: number;
  sourceWallet: Wallet;
  note?: string;
  recipientGets: number;
  rate: Rate | null;
  lockRate?: boolean;
}

export interface SendMoneyRecipientState {
  useExisting: boolean;
  existingBeneficiary: Beneficiary | null;
  receiver_name: string;
  receiver_account: string;
  receiver_bank_code: string;
  receiver_bank_name?: string;
  description: string;
}

export interface SendMoneyPayload {
  amount: number;
  source_wallet: number;
  platform: string;
  note?: string;
  receiver_account?: string;
  receiver_name?: string;
  receiver_bank_code?: string;
  receiver_email?: string;
  beneficiary?: number;
  description?: string;
  security_question?: string;
  security_answer?: string;
}

export interface SendMoneyResponse {
  succeeded: boolean;
  message: string;
  data?: { reference: string; amount: string; currency: string };
  errors?: { [key: string]: string[] };
}
