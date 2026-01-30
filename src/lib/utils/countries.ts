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
 * Nigerian States and Federal Capital Territory (36 states + FCT)
 * Value stored in form is the state name (e.g. "Lagos", "Federal Capital Territory").
 */
export const NIGERIAN_STATES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "Abia", name: "Abia" },
  { code: "Adamawa", name: "Adamawa" },
  { code: "Akwa Ibom", name: "Akwa Ibom" },
  { code: "Anambra", name: "Anambra" },
  { code: "Bauchi", name: "Bauchi" },
  { code: "Bayelsa", name: "Bayelsa" },
  { code: "Benue", name: "Benue" },
  { code: "Borno", name: "Borno" },
  { code: "Cross River", name: "Cross River" },
  { code: "Delta", name: "Delta" },
  { code: "Ebonyi", name: "Ebonyi" },
  { code: "Edo", name: "Edo" },
  { code: "Ekiti", name: "Ekiti" },
  { code: "Enugu", name: "Enugu" },
  { code: "FCT", name: "Federal Capital Territory" },
  { code: "Gombe", name: "Gombe" },
  { code: "Imo", name: "Imo" },
  { code: "Jigawa", name: "Jigawa" },
  { code: "Kaduna", name: "Kaduna" },
  { code: "Kano", name: "Kano" },
  { code: "Katsina", name: "Katsina" },
  { code: "Kebbi", name: "Kebbi" },
  { code: "Kogi", name: "Kogi" },
  { code: "Kwara", name: "Kwara" },
  { code: "Lagos", name: "Lagos" },
  { code: "Nasarawa", name: "Nasarawa" },
  { code: "Niger", name: "Niger" },
  { code: "Ogun", name: "Ogun" },
  { code: "Ondo", name: "Ondo" },
  { code: "Osun", name: "Osun" },
  { code: "Oyo", name: "Oyo" },
  { code: "Plateau", name: "Plateau" },
  { code: "Rivers", name: "Rivers" },
  { code: "Sokoto", name: "Sokoto" },
  { code: "Taraba", name: "Taraba" },
  { code: "Yobe", name: "Yobe" },
  { code: "Zamfara", name: "Zamfara" },
];

/**
 * Check if a country code requires province/territory selection (Canada)
 */
export function requiresProvince(countryCode: string): boolean {
  return countryCode === "CA";
}

/**
 * Check if a country has a predefined list of states/provinces (dropdown instead of free text)
 */
export function hasStateOptions(countryCode: string): boolean {
  return countryCode === "CA" || countryCode === "NG";
}

/**
 * Get state/province options for a country. Returns array for CA/NG, null otherwise.
 */
export function getStateOptionsForCountry(countryCode: string): ReadonlyArray<{ code: string; name: string }> | null {
  if (countryCode === "CA") return CANADIAN_PROVINCES;
  if (countryCode === "NG") return NIGERIAN_STATES;
  return null;
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
  if (countryCode === "CA") return "Province/Territory";
  if (countryCode === "NG") return "State";
  return "State/Province";
}

/**
 * Get placeholder for state/province select when country has predefined options
 */
export function getStateSelectPlaceholder(countryCode: string): string {
  if (countryCode === "CA") return "Select province/territory";
  if (countryCode === "NG") return "Select state";
  return "Select";
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
