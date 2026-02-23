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
