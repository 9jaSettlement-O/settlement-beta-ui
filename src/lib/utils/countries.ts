import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { getCountries } from "react-phone-number-input";

countries.registerLocale(enLocale);

/**
 * Get display name for a country code
 */
export function getCountryName(countryCode: string): string {
  return countries.getName(countryCode, "en") || countryCode;
}

/**
 * Canadian Provinces and Territories
 */
export const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "YT", name: "Yukon" },
] as const;

/**
 * Check if a country code requires province/territory selection
 */
export function requiresProvince(countryCode: string): boolean {
  return countryCode === "CA";
}

/**
 * Check if a country code uses state field
 */
export function usesState(countryCode: string): boolean {
  return countryCode === "NG" || (!requiresProvince(countryCode) && countryCode !== "");
}

/**
 * Get the label for state/province field based on country
 */
export function getStateProvinceLabel(countryCode: string): string {
  if (requiresProvince(countryCode)) {
    return "Province/Territory";
  }
  return "State";
}

/**
 * Get sorted countries with Canada and Nigeria first
 */
export function getSortedCountries(): string[] {
  const allCountries = getCountries();
  const priorityCountries = ["CA", "NG"]; // Canada and Nigeria first
  const priority = priorityCountries.filter((code: string) => allCountries.includes(code));
  const others = allCountries.filter((code: string) => !priorityCountries.includes(code));
  return [...priority, ...others];
}

/**
 * Get phone number format example for a given country
 * Returns a placeholder showing the expected format
 */
export function getPhoneFormatExample(countryCode: string): string {
  const formatExamples: Record<string, string> = {
    CA: "123-456-7890", // Canada: (123) 456-7890
    NG: "801 234 5678", // Nigeria: 0801 234 5678
    US: "(123) 456-7890", // United States
    GB: "7700 900123", // United Kingdom: 07700 900123
    AU: "0412 345 678", // Australia: 0412 345 678
    FR: "06 12 34 56 78", // France: 06 12 34 56 78
    DE: "030 12345678", // Germany: 030 12345678
    IN: "98765 43210", // India: 98765 43210
  };

  return formatExamples[countryCode] || "1234567890";
}
