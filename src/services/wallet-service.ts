/**
 * Wallet and currency conversion service
 * Mock implementation when no API is available (same paradigm as onboarding-service).
 */

import storage from "@/utils/storage.util";
import { parseAmount } from "@/lib/utils/currency.util";
import { STORAGE_KEYS } from "@/lib/constants";
import logger from "@/utils/logger.util";
import type {
  DashboardData,
  DashboardResponse,
  RatesResponse,
  Rate,
  Wallet,
  Country,
  ConvertMoneyRequest,
  ConvertMoneyResponse,
} from "@/types/wallet.types";

const MOCK_API_DELAY = 800;

function buildMockCountry(
  name: string,
  code: string,
  currencyCode: string,
  minSend: string,
  maxSend: string
): Country {
  return {
    name,
    code,
    currency_code: currencyCode,
    minimum_send_amount: minSend,
    maximum_send_amount: maxSend,
    payment_gateway: "",
  };
}

function buildMockWallets(): Wallet[] {
  return [
    {
      id: 1,
      available_balance: "5000.00",
      total_balance: "5000.00",
      country: buildMockCountry("Canada", "CA", "CAD", "100", "10000"),
    },
    {
      id: 2,
      available_balance: "1250000.00",
      total_balance: "1250000.00",
      country: buildMockCountry("Nigeria", "NG", "NGN", "1000", "5000000"),
    },
  ];
}

function buildMockRates(): Rate[] {
  return [
    {
      id: 1,
      sending_country: {
        name: "Canada",
        code: "CA",
        currency_code: "CAD",
        minimum_send_amount: "100",
        maximum_send_amount: "10000",
      },
      receiving_country: {
        name: "Nigeria",
        code: "NG",
        currency_code: "NGN",
        minimum_send_amount: "1000",
        maximum_send_amount: "5000000",
      },
      rate: "1200",
      fee: "0",
      fee_type: "percentage",
      flat_fee: "0",
      is_active: true,
      operator_type: "multiply",
    },
    {
      id: 2,
      sending_country: {
        name: "Nigeria",
        code: "NG",
        currency_code: "NGN",
        minimum_send_amount: "1000",
        maximum_send_amount: "5000000",
      },
      receiving_country: {
        name: "Canada",
        code: "CA",
        currency_code: "CAD",
        minimum_send_amount: "100",
        maximum_send_amount: "10000",
      },
      rate: "1200",
      fee: "0",
      fee_type: "percentage",
      flat_fee: "0",
      is_active: true,
      operator_type: "divide",
    },
  ];
}

/**
 * Get dashboard data (wallets + optional transactions)
 */
export async function getDashboard(): Promise<DashboardResponse> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));

    const cached = storage.fetch(STORAGE_KEYS.WALLETS_DASHBOARD_MOCK) as
      | { wallets: Wallet[] }
      | null;
    const wallets = cached?.wallets ?? buildMockWallets();

    const data: DashboardData = {
      wallets,
      transactions: [],
    };

    logger.debug("Mock: Dashboard loaded", { walletCount: wallets.length });

    return {
      succeeded: true,
      msg: "OK",
      data,
    };
  } catch (error) {
    logger.error("Error loading dashboard", error instanceof Error ? error : new Error(String(error)));
    return {
      succeeded: false,
      msg: "Unable to load dashboard",
      errors: {},
    };
  }
}

/**
 * Get exchange rates
 */
export async function getRates(): Promise<RatesResponse> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));

    const data = buildMockRates();
    logger.debug("Mock: Rates loaded", { count: data.length });

    return {
      succeeded: true,
      msg: "OK",
      data,
    };
  } catch (error) {
    logger.error("Error loading rates", error instanceof Error ? error : new Error(String(error)));
    return {
      succeeded: false,
      msg: "Unable to load rates",
      data: [],
      errors: {},
    };
  }
}

/**
 * Convert money (mock)
 * Updates mock wallet balances in storage so dashboard reflects the change.
 */
export async function convertMoney(request: ConvertMoneyRequest): Promise<ConvertMoneyResponse> {
  try {
    await new Promise((r) => setTimeout(r, MOCK_API_DELAY));

    const amount = parseFloat(request.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount");
    }

    const cached = storage.fetch(STORAGE_KEYS.WALLETS_DASHBOARD_MOCK) as
      | { wallets: Wallet[] }
      | null;
    const wallets = cached?.wallets ?? buildMockWallets();

    // Mock: deduct from first wallet and add to second (simplified; in real API rate_id would define pair)
    const [source, dest] = wallets;
    const sourceBal = parseFloat(source.available_balance);
    if (sourceBal < amount) {
      throw new Error("Insufficient balance in source wallet");
    }

    // Simplified mock: assume rate 1200 (CAD->NGN multiply)
    const rateNum = 1200;
    const destAmount = amount * rateNum;
    const newWallets: Wallet[] = [
      {
        ...source,
        available_balance: (sourceBal - amount).toFixed(2),
        total_balance: (parseFloat(source.total_balance) - amount).toFixed(2),
      },
      {
        ...dest,
        available_balance: (parseFloat(dest.available_balance) + destAmount).toFixed(2),
        total_balance: (parseFloat(dest.total_balance) + destAmount).toFixed(2),
      },
    ];

    storage.keep(STORAGE_KEYS.WALLETS_DASHBOARD_MOCK, { wallets: newWallets });

    logger.info("Mock: Convert money", {
      amount: request.amount,
      rate_id: request.rate_id,
      platform: request.platform,
    });

    return {
      succeeded: true,
      message: "Conversion successful",
      data: {
        id: `txn_${Date.now()}`,
        amount: request.amount,
        currency: source.country.currency_code,
      },
    };
  } catch (error) {
    logger.error("Error converting money", error instanceof Error ? error : new Error(String(error)));
    return {
      succeeded: false,
      message: "Conversion failed. Please try again.",
      errors: { non_field_errors: ["An unexpected error occurred"] },
    };
  }
}

/**
 * Persist wallets (e.g. after dashboard fetch) so convert mock can use latest balances
 */
export function persistWalletsForMock(wallets: Wallet[]): void {
  try {
    storage.keep(STORAGE_KEYS.WALLETS_DASHBOARD_MOCK, { wallets });
  } catch {
    // ignore
  }
}

/**
 * Convert amount using a rate (mirrors mobile DataBean.convert)
 */
export function convertWithRate(rate: Rate, amount: number): number {
  const rateNum = parseAmount(rate.rate);
  if (rate.operator_type === "multiply") {
    return Number((rateNum * amount).toFixed(4));
  }
  return Number((amount / rateNum).toFixed(4));
}
