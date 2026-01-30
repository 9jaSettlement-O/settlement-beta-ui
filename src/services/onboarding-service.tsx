import storage from "@/utils/storage.util";
import type { CreateAccountData } from "@/types/onboarding.types";
import logger from "@/utils/logger.util";
import { STORAGE_KEYS, OTP, ONBOARDING } from "@/lib/constants";

/**
 * Service to handle onboarding form data
 * Stores data locally until API is ready
 */
class OnboardingService {
  private readonly STORAGE_KEY = STORAGE_KEYS.ONBOARDING_FORM_DATA;
  private readonly MOCK_API_DELAY = 1500; // Simulate API delay

  /**
   * Save account creation data locally
   */
  async saveAccountData(data: CreateAccountData): Promise<{
    succeeded: boolean;
    message: string;
    data?: { id: string; account_exists: boolean };
    errors?: { [key: string]: string[] };
  }> {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, this.MOCK_API_DELAY));

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return {
          succeeded: false,
          message: "Invalid email format",
          errors: {
            email: ["Please enter a valid email address"],
          },
        };
      }

      // Check if email already exists and is verified (mock)
      // If same email but not yet verified, allow re-use and resend (e.g. user used "Wrong email?" then retried)
      const existingData = storage.fetch(this.STORAGE_KEY);
      let uid: string;
      let formData: Record<string, unknown>;

      if (existingData && existingData.email === data.email) {
        if (existingData.emailVerified) {
          return {
            succeeded: false,
            message: "Email already registered",
            errors: {
              email: ["This email is already registered"],
            },
          };
        }
        // Same email but not verified: reuse existing uid and overwrite (resend flow)
        uid = existingData.uid;
        formData = {
          ...data,
          uid,
          createdAt: existingData.createdAt || new Date().toISOString(),
          emailVerified: false,
        };
      } else {
        uid = `uid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        formData = {
          ...data,
          uid,
          createdAt: new Date().toISOString(),
          emailVerified: false,
        };
      }

      storage.keep(this.STORAGE_KEY, formData);

      // Simulate sending verification email (in production, backend sends email automatically)
      // The backend sends the activation email when /account/register/ is called
      logger.info("Mock: Verification email would be sent", { email: data.email });
      logger.debug("Note: In production, the backend automatically sends the verification email when account is created.");

      return {
        succeeded: true,
        message: "Account created successfully. Please check your email for verification code.",
        data: {
          id: uid,
          account_exists: !!(existingData && existingData.email === data.email && !existingData.emailVerified),
        },
      };
    } catch (error) {
      logger.error("Error saving account data", error instanceof Error ? error : new Error(String(error)));
      return {
        succeeded: false,
        message: "Failed to create account. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
      };
    }
  }

  /**
   * Verify email with OTP (mock)
   */
  async verifyEmail(uid: string, token: string): Promise<{
    succeeded: boolean;
    message: string;
    data?: any;
    errors?: { [key: string]: string[] };
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, this.MOCK_API_DELAY));

      const formData = storage.fetch(this.STORAGE_KEY);

      if (!formData || formData.uid !== uid) {
        return {
          succeeded: false,
          message: "Invalid verification code",
          errors: {
            token: ["Invalid or expired verification code"],
          },
        };
      }

      // Check for stored valid OTP
      const emailOtpKey = STORAGE_KEYS.EMAIL_OTP_PREFIX + formData.email;
      const storedOtp = storage.fetch(emailOtpKey);

      // If OTP was stored (from resend), validate against it
      if (storedOtp) {
        if (storedOtp.otp !== token) {
          return {
            succeeded: false,
            message: "Invalid verification code",
            errors: {
              token: ["Invalid or expired verification code"],
            },
          };
        }
        // Check if OTP has expired
        if (storedOtp.expiresAt && Date.now() > storedOtp.expiresAt) {
          return {
            succeeded: false,
            message: "Verification code has expired",
            errors: {
              token: ["Verification code has expired. Please request a new one."],
            },
          };
        }
      } else {
        // If no stored OTP, accept any 6-digit code except "000000" (for initial email)
        if (token === "000000") {
          return {
            succeeded: false,
            message: "Invalid verification code",
            errors: {
              token: ["Invalid verification code"],
            },
          };
        }
      }

      // Update form data (DB Trip 1: after email verified by OTP — in production, sync user to DB with verified=false, transaction_pin_set=false, etc.)
      const updatedData = {
        ...formData,
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
      };

      storage.keep(this.STORAGE_KEY, updatedData);

      // Delete the OTP after successful verification
      storage.deleteItem(emailOtpKey);

      return {
        succeeded: true,
        message: "Email verified successfully",
        data: {
          uid,
          email: formData.email,
        },
      };
    } catch (error) {
      logger.error("Error verifying email", error instanceof Error ? error : new Error(String(error)));
      return {
        succeeded: false,
        message: "Failed to verify email. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
      };
    }
  }

  /**
   * Resend OTP (mock)
   * When a new OTP is requested, the previous one becomes invalid
   */
  async resendOTP(email: string): Promise<{
    succeeded: boolean;
    message: string;
    data?: any;
    errors?: { [key: string]: string[] };
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const formData = storage.fetch(this.STORAGE_KEY);

      if (!formData || formData.email !== email) {
        return {
          succeeded: false,
          message: "Email not found",
          errors: {
            email: ["Email not found in our records"],
          },
        };
      }

      // Generate new OTP and invalidate previous one
      const emailOtpKey = STORAGE_KEYS.EMAIL_OTP_PREFIX + email;
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random OTP
      
      // Store new OTP (this automatically invalidates any previous OTP for this email)
      storage.keep(emailOtpKey, {
        otp: newOtp,
        email,
        createdAt: Date.now(),
        expiresAt: Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000,
      });

      // Simulate resending verification email (in production, backend sends email via GET /account/activation/?email=...)
      logger.info("Mock: New verification code sent", { email, otp: newOtp });
      logger.debug("Note: Previous OTP for this email is now invalid.");
      logger.debug("Note: In production, calling GET /account/activation/?email=... generates a new token and sends it via email.");

      return {
        succeeded: true,
        message: "Verification code resent successfully. Please check your email.",
        data: email,
      };
    } catch (error) {
      logger.error("Error resending OTP", error instanceof Error ? error : new Error(String(error)));
      return {
        succeeded: false,
        message: "Failed to resend code. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
      };
    }
  }

  /**
   * Get saved form data
   */
  getFormData(): CreateAccountData | null {
    return storage.fetch(this.STORAGE_KEY);
  }

  /**
   * Setup transaction PIN (mock)
   */
  async setupPin(uid: string, encryptedPin: string): Promise<{
    error: boolean;
    message: string;
    data?: any;
    errors?: { [key: string]: string[] };
    status: number;
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, this.MOCK_API_DELAY));

      const formData = storage.fetch(this.STORAGE_KEY);

      if (!formData || formData.uid !== uid) {
        return {
          error: true,
          message: "User not found",
          errors: {
            uid: ["Invalid user ID"],
          },
          status: 404,
        };
      }

      // DB Trip 2: transaction PIN set — in production, update user schema (transaction_pin_set=true)
      const updatedData = {
        ...formData,
        pinSetup: true,
        pinSetupAt: new Date().toISOString(),
      };

      storage.keep(this.STORAGE_KEY, updatedData);

      logger.info("Mock: PIN setup completed", { uid });
      logger.debug("Note: In production, this would be saved to the backend via POST /account/set-pin/{uid}/");

      return {
        error: false,
        message: "PIN setup successful",
        data: { uid, pinSetup: true },
        errors: [],
        status: 200,
      };
    } catch (error) {
      logger.error("Error setting up PIN", error instanceof Error ? error : new Error(String(error)));
      return {
        error: true,
        message: "Failed to setup PIN. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
        status: 500,
      };
    }
  }

  /**
   * Save biodata/profile information (mock)
   */
  async saveBiodata(data: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    country: string;
    state: string;
    address: string;
  }): Promise<{
    error: boolean;
    message: string;
    data?: any;
    errors?: { [key: string]: string[] };
    status: number;
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, this.MOCK_API_DELAY));

      const formData = storage.fetch(this.STORAGE_KEY);

      if (!formData) {
        return {
          error: true,
          message: "Account not found",
          errors: {
            non_field_errors: ["Please create an account first"],
          },
          status: 404,
        };
      }

      // DB Trip 3 (biodata part): in production, update user with biodata; phone + phone_verified updated when verifyPhone succeeds
      const updatedData = {
        ...formData,
        biodata: data,
        biodataSavedAt: new Date().toISOString(),
      };

      storage.keep(this.STORAGE_KEY, updatedData);

      logger.info("Mock: Biodata saved", { uid: formData.uid });
      logger.debug("Note: In production, this would be saved to the backend via POST /account/profile/");

      return {
        error: false,
        message: "Profile updated successfully",
        data: { ...data },
        errors: [],
        status: 200,
      };
    } catch (error) {
      logger.error("Error saving biodata", error instanceof Error ? error : new Error(String(error)));
      return {
        error: true,
        message: "Failed to save biodata. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
        status: 500,
      };
    }
  }

  /**
   * Send phone verification OTP (mock)
   */
  async sendPhoneOTP(phone: string): Promise<{
    error: boolean;
    message: string;
    data?: any;
    errors?: { [key: string]: string[] };
    status: number;
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const formData = storage.fetch(this.STORAGE_KEY);

      if (!formData) {
        return {
          error: true,
          message: "Account not found",
          errors: {
            non_field_errors: ["Please create an account first"],
          },
          status: 404,
        };
      }

      // Store phone OTP in memory (mock - in production, backend sends SMS)
      const mockOTP = "123456"; // For testing, accept this OTP
      const otpKey = `phone_otp_${phone}`;
      storage.keep(otpKey, {
        otp: mockOTP,
        phone,
        expiresAt: Date.now() + 300000, // 5 minutes
      });

      logger.info("Mock: OTP sent to phone", { phone, testOtp: "123456" });
      logger.debug("Note: In production, this would send an SMS via POST /account/send-otp/");

      return {
        error: false,
        message: "OTP sent successfully",
        data: { phone },
        errors: [],
        status: 200,
      };
    } catch (error) {
      logger.error("Error sending phone OTP", error instanceof Error ? error : new Error(String(error)));
      return {
        error: true,
        message: "Failed to send OTP. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
        status: 500,
      };
    }
  }

  /**
   * Verify phone with OTP (mock)
   */
  async verifyPhone(phone: string, otp: string): Promise<{
    error: boolean;
    message: string;
    data?: any;
    errors?: { [key: string]: string[] };
    status: number;
  }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, this.MOCK_API_DELAY));

      const formData = storage.fetch(this.STORAGE_KEY);

      if (!formData) {
        return {
          error: true,
          message: "Account not found",
          errors: {
            non_field_errors: ["Please create an account first"],
          },
          status: 404,
        };
      }

      // Mock OTP validation (accept "123456" or any 6-digit code except "000000")
      const otpKey = STORAGE_KEYS.PHONE_OTP_PREFIX + phone;
      const storedOtp = storage.fetch(otpKey);

      if (otp === "000000") {
        return {
          error: true,
          message: "Invalid verification code",
          errors: {
            otp: ["Invalid verification code"],
          },
          status: 400,
        };
      }

      // Check if OTP is valid
      const isValidOtp = 
        (storedOtp && storedOtp.otp === otp) || // Stored OTP matches
        (otp.length === 6 && otp !== "000000"); // Any 6-digit code for testing (except 000000)

      if (isValidOtp) {
        // DB Trip 3 (phone part): update user with phone + phone_verified=true
        const updatedData = {
          ...formData,
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
          phone: phone,
        };

        storage.keep(this.STORAGE_KEY, updatedData);
        if (storedOtp) {
          storage.deleteItem(otpKey);
        }

        logger.info("Mock: Phone verified", { phone });
        logger.debug("Note: In production, this would verify via POST /account/verify-otp/ and update user.phone + user.phone_verified");

        return {
          error: false,
          message: "Phone verified successfully",
          data: { phone, verified: true },
          errors: [],
          status: 200,
        };
      } else {
        return {
          error: true,
          message: "Invalid verification code",
          errors: {
            otp: ["Invalid or expired verification code"],
          },
          status: 400,
        };
      }
    } catch (error) {
      logger.error("Error verifying phone", error instanceof Error ? error : new Error(String(error)));
      return {
        error: true,
        message: "Failed to verify phone. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
        status: 500,
      };
    }
  }

  /**
   * Get KYC token for Sumsub (mock)
   * In production, this would be fetched from the backend
   */
  async getKycToken(uid: string): Promise<{
    error: boolean;
    message: string;
    data?: string;
    errors?: { [key: string]: string[] };
    status: number;
  }> {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, this.MOCK_API_DELAY));

      if (!uid) {
        return {
          error: true,
          message: "User ID is required",
          errors: {
            uid: ["User ID is required"],
          },
          status: 400,
        };
      }

      // Generate a mock Sumsub access token
      // In production, this would be a real token from the backend
      const mockToken = `mock_sumsub_token_${uid}_${Date.now()}`;

      logger.info("Mock: KYC token generated", { uid });
      logger.debug("Note: In production, this would be fetched from POST /account/activation/kyc-token/");

      return {
        error: false,
        message: "KYC token generated successfully",
        data: mockToken,
        status: 200,
      };
    } catch (error) {
      logger.error("Error generating KYC token", error instanceof Error ? error : new Error(String(error)));
      return {
        error: true,
        message: "Failed to generate KYC token. Please try again.",
        errors: {
          non_field_errors: ["An unexpected error occurred"],
        },
        status: 500,
      };
    }
  }

  /**
   * Clear saved form data
   */
  clearFormData(): void {
    storage.deleteItem(this.STORAGE_KEY);
  }
}

const onboardingService = new OnboardingService();
export default onboardingService;
