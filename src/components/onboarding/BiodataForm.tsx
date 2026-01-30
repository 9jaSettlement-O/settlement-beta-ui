import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import {
  CANADIAN_PROVINCES,
  getCountryName,
  getSortedCountries,
  getStateProvinceLabel,
  requiresProvince,
} from "@/lib/utils/countries";

export interface BiodataFormValues {
  nationality: string;
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  country: string;
  state: string;
  address: string;
  nin: string;
  confirmNin: string;
}

export interface BiodataFormProps {
  biodata: BiodataFormValues;
  setBiodata: React.Dispatch<React.SetStateAction<BiodataFormValues>>;
  dateOfBirth: Date | null;
  setDateOfBirth: (date: Date | null) => void;
  ninErrors: { nin?: string; confirmNin?: string };
  setNinErrors: React.Dispatch<React.SetStateAction<{ nin?: string; confirmNin?: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  onBack?: () => void;
  onCountryChange?: (countryCode: string) => void;
  submitLabel?: string;
}

const SELECT_STYLE =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const CAUTION_STYLE = "text-xs text-amber-600 dark:text-amber-500";

const isNigerian = (nationality: string) => nationality === "NG";

const NIN_MAX_LENGTH = 11;

/**
 * Shared personal biodata form for Individual and Agent onboarding.
 * Nationality first; NIN/Confirm NIN shown only when Nationality is Nigeria.
 * NIN "exactly 11 digits" error shows only on blur; "cannot be more than 11" shows when user tries to exceed 11.
 */
export function BiodataForm({
  biodata,
  setBiodata,
  dateOfBirth,
  setDateOfBirth,
  ninErrors,
  setNinErrors,
  onSubmit,
  isSubmitting,
  onCountryChange,
  submitLabel = "Continue",
}: BiodataFormProps) {
  const showNin = isNigerian(biodata.nationality);
  const [ninExceededCaution, setNinExceededCaution] = React.useState(false);
  const [confirmNinMismatchCaution, setConfirmNinMismatchCaution] = React.useState(false);

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-6"
      layout
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Nationality – first field */}
      <div className="space-y-2">
        <Label htmlFor="nationality">Nationality *</Label>
        <select
          id="nationality"
          value={biodata.nationality}
          onChange={(e) => {
            const code = e.target.value;
            if (code !== "NG") {
              setNinExceededCaution(false);
              setConfirmNinMismatchCaution(false);
            }
            setBiodata((prev) => ({
              ...prev,
              nationality: code,
              nin: code !== "NG" ? "" : prev.nin,
              confirmNin: code !== "NG" ? "" : prev.confirmNin,
            }));
            setNinErrors({});
          }}
          required
          className={SELECT_STYLE}
        >
          <option value="">Select nationality</option>
          {getSortedCountries().map((code) => (
            <option key={code} value={code}>
              {getCountryName(code)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={biodata.firstName}
            onChange={(_e, sanitized) => setBiodata((prev) => ({ ...prev, firstName: sanitized }))}
            sanitizeMode="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={biodata.lastName}
            onChange={(_e, sanitized) => setBiodata((prev) => ({ ...prev, lastName: sanitized }))}
            sanitizeMode="name"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            value={biodata.middleName}
            onChange={(_e, sanitized) => setBiodata((prev) => ({ ...prev, middleName: sanitized }))}
            sanitizeMode="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <DatePicker
            date={dateOfBirth ?? undefined}
            onDateChange={(date) => setDateOfBirth(date ?? null)}
            maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
            placeholder="Select your date of birth"
            required
            openToDate={new Date(new Date().setFullYear(new Date().getFullYear() - 25))}
          />
        </div>
      </div>

      {/* NIN & Confirm NIN – only when Nationality is Nigeria, appears after Middle Name/DOB */}
      <AnimatePresence>
        {showNin && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="nin">NIN *</Label>
              <Input
                id="nin"
                value={biodata.nin}
                onChange={(_e, sanitized) => {
                  if (sanitized.length > NIN_MAX_LENGTH) {
                    setBiodata((prev) => ({ ...prev, nin: sanitized.slice(0, NIN_MAX_LENGTH) }));
                    setNinExceededCaution(true);
                  } else {
                    setBiodata((prev) => ({ ...prev, nin: sanitized }));
                    setNinExceededCaution(false);
                    setNinErrors((prev) => ({ ...prev, nin: undefined }));
                    if (biodata.confirmNin && sanitized.length === NIN_MAX_LENGTH) {
                      if (sanitized !== biodata.confirmNin) {
                        setConfirmNinMismatchCaution(true);
                        setNinErrors((prev) => ({ ...prev, confirmNin: undefined }));
                      } else {
                        setConfirmNinMismatchCaution(false);
                      }
                    }
                  }
                }}
                onBlur={() => {
                  const len = biodata.nin.length;
                  if (len > 0 && len !== NIN_MAX_LENGTH) {
                    setNinErrors((prev) => ({ ...prev, nin: "NIN must be exactly 11 digits" }));
                  } else if (len === NIN_MAX_LENGTH) {
                    setNinErrors((prev) => ({ ...prev, nin: undefined }));
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  toast.error("Please retype NIN directly from your slip");
                }}
                sanitizeMode="numeric"
                required
                error={ninErrors.nin}
                placeholder="Enter 11-digit NIN"
              />
              <AnimatePresence>
                {ninExceededCaution && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={CAUTION_STYLE}
                    style={{ overflow: "hidden" }}
                  >
                    NIN cannot be more than 11 digits
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNin">Confirm NIN *</Label>
              <Input
                id="confirmNin"
                value={biodata.confirmNin}
                onFocus={() => setNinExceededCaution(false)}
                onChange={(_e, sanitized) => {
                  if (sanitized.length > NIN_MAX_LENGTH) {
                    setBiodata((prev) => ({ ...prev, confirmNin: sanitized.slice(0, NIN_MAX_LENGTH) }));
                  } else {
                    setBiodata((prev) => ({ ...prev, confirmNin: sanitized }));
                    setNinErrors((prev) => ({ ...prev, confirmNin: undefined }));
                    if (sanitized.length === NIN_MAX_LENGTH && biodata.nin && sanitized !== biodata.nin) {
                      setConfirmNinMismatchCaution(true);
                    } else {
                      setConfirmNinMismatchCaution(false);
                      if (sanitized.length === NIN_MAX_LENGTH && biodata.nin === sanitized) {
                        setNinErrors((prev) => ({ ...prev, confirmNin: undefined }));
                      }
                    }
                  }
                }}
                onBlur={() => {
                  const len = biodata.confirmNin.length;
                  if (len > 0 && len !== NIN_MAX_LENGTH) {
                    setNinErrors((prev) => ({ ...prev, confirmNin: "NIN must be exactly 11 digits" }));
                    setConfirmNinMismatchCaution(false);
                  } else if (len === NIN_MAX_LENGTH && biodata.nin && biodata.nin !== biodata.confirmNin) {
                    setConfirmNinMismatchCaution(true);
                    setNinErrors((prev) => ({ ...prev, confirmNin: undefined }));
                  } else if (len === NIN_MAX_LENGTH) {
                    setNinErrors((prev) => ({ ...prev, confirmNin: undefined }));
                    setConfirmNinMismatchCaution(false);
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  toast.error("Please retype NIN directly from your slip");
                }}
                sanitizeMode="numeric"
                required
                error={confirmNinMismatchCaution ? undefined : ninErrors.confirmNin}
                placeholder="Re-enter 11-digit NIN"
              />
              <AnimatePresence>
                {confirmNinMismatchCaution && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={CAUTION_STYLE}
                    style={{ overflow: "hidden" }}
                  >
                    NINs don&apos;t match, check again
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">Country of residence *</Label>
          <select
            id="country"
            value={biodata.country}
            onChange={(e) => {
              const countryCode = e.target.value;
              setBiodata((prev) => ({ ...prev, country: countryCode, state: "" }));
              onCountryChange?.(countryCode);
            }}
            required
            className={SELECT_STYLE}
          >
            <option value="">Select country</option>
            {getSortedCountries().map((code) => (
              <option key={code} value={code}>
                {getCountryName(code)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="state-province">
            {biodata.country ? getStateProvinceLabel(biodata.country) : "State/Province"} *
          </Label>
          {requiresProvince(biodata.country) ? (
            <select
              id="state-province"
              value={biodata.state}
              onChange={(e) => setBiodata((prev) => ({ ...prev, state: e.target.value }))}
              required
              className={SELECT_STYLE}
            >
              <option value="">Select province/territory</option>
              {CANADIAN_PROVINCES.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="state-province"
              value={biodata.state}
              onChange={(_e, sanitized) => setBiodata((prev) => ({ ...prev, state: sanitized }))}
              placeholder={biodata.country === "NG" ? "Enter your state" : "Enter your state/province"}
              sanitizeMode="state"
              required
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Input
          id="address"
          value={biodata.address}
          onChange={(_e, sanitized) => setBiodata((prev) => ({ ...prev, address: sanitized }))}
          placeholder="e.g., 123 Main Street, Apt 4B"
          sanitizeMode="address"
          required
        />
        <p className="text-xs text-muted-foreground">
          Include street number, street name, and apartment/unit number if applicable
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </motion.form>
  );
}
