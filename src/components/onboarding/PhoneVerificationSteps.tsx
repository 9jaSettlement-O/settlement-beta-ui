import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getPhoneFormatExample } from "@/lib/utils/countries";
import { VERIFICATION_CONTENT_WIDTH } from "@/lib/constants";

const PHONE_INPUT_CLASS =
  "[&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-2 [&_.PhoneInput]:w-full [&_.PhoneInputCountry]:border-0 [&_.PhoneInputCountry]:bg-transparent [&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:h-10 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-2 [&_.PhoneInputCountry]:min-w-fit [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-6 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:h-10 [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted-foreground";

export interface PhoneNumberEntryProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  phoneCountryCode: string;
  onCountryChange: (country: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
  isPending?: boolean;
  sendButtonLabel?: string;
}

/**
 * Reusable Phone Number entry step (Individual & Agent KYC).
 * Constrained width via VERIFICATION_CONTENT_WIDTH.
 */
export function PhoneNumberEntry({
  phone,
  onPhoneChange,
  phoneCountryCode,
  onCountryChange,
  onSubmit,
  onBack,
  isPending = false,
  sendButtonLabel = "Send Verification Code",
}: PhoneNumberEntryProps) {
  return (
    <div className={`space-y-8 ${VERIFICATION_CONTENT_WIDTH}`}>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Phone Number</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your phone number to receive a verification code
        </p>
      </div>

      <Card>
        <CardHeader>
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mb-4"
              type="button"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="flex items-center gap-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <PhoneInput
                  key={phoneCountryCode}
                  international
                  defaultCountry={phoneCountryCode as "NG" | "CA"}
                  value={phone}
                  onChange={(value) => onPhoneChange(value || "")}
                  onCountryChange={(country) => country && onCountryChange(country)}
                  placeholder={getPhoneFormatExample(phoneCountryCode)}
                  className={PHONE_INPUT_CLASS}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format example: {getPhoneFormatExample(phoneCountryCode)}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!phone || isPending}
              size="lg"
            >
              {isPending ? "Sending..." : sendButtonLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export interface PhoneNumberVerifyProps {
  phone: string;
  phoneOtp: string;
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
  onResend: () => void;
  resendCooldown: number;
  isVerifying?: boolean;
  isResending?: boolean;
  verifyButtonLabel?: string;
  showBackButton?: boolean;
}

/**
 * Reusable Phone OTP verify step (Individual & Agent KYC).
 * Constrained width via VERIFICATION_CONTENT_WIDTH; OTP form uses fixed width for digit boxes.
 */
export function PhoneNumberVerify({
  phone,
  phoneOtp,
  onOtpChange,
  onSubmit,
  onBack,
  onResend,
  resendCooldown,
  isVerifying = false,
  isResending = false,
  verifyButtonLabel = "Verify Phone",
  showBackButton = true,
}: PhoneNumberVerifyProps) {
  return (
    <div className={`space-y-8 ${VERIFICATION_CONTENT_WIDTH}`}>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Verify Phone Number</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code sent to {phone}
        </p>
      </div>

      <Card>
        {showBackButton && onBack && (
          <CardHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mb-4"
              type="button"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </CardHeader>
        )}
        <CardContent className={showBackButton && onBack ? undefined : "pt-6"}>
          <form onSubmit={onSubmit} className="flex flex-col items-center space-y-6 w-full max-w-[17.5rem] mx-auto">
            <div className="flex w-full flex-col items-center space-y-4 text-center">
              <Label htmlFor="phone-otp" className="text-center">Enter OTP *</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(value) => onOtpChange(value.replace(/\D/g, ""))}
                  disabled={isVerifying}
                  pattern="[0-9]*"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full min-w-0"
              disabled={phoneOtp.length !== 6 || isVerifying}
              size="lg"
            >
              {isVerifying ? "Verifying..." : verifyButtonLabel}
            </Button>

            <div className="text-center space-y-2 w-full">
              {resendCooldown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend code in {Math.floor(resendCooldown / 60)}:{(resendCooldown % 60).toString().padStart(2, "0")}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onResend}
                  disabled={isResending}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isResending ? "Sending..." : "Resend code"}
                </button>
              )}
              {onBack && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Wrong phone number?
                  </button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
