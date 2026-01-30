import { z } from "zod";
import { sanitizeString, sanitizeEmail, sanitizeName, sanitizeAddress, sanitizeState, sanitizeAgentId } from "@/lib/security";

// Account Type Selection
export const accountTypeSchema = z.enum(["individual", "business", "agent"]);

// Name field validation - no numbers, only letters, spaces, hyphens, apostrophes
const nameFieldSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be at most 50 characters")
  .transform((val) => sanitizeName(val))
  .refine((val) => val.length > 0, "Name is required")
  .refine(
    (val) => /^[a-zA-Z\s'-]+$/.test(val),
    "Name can only contain letters, spaces, hyphens, and apostrophes"
  )
  .refine(
    (val) => !/\d/.test(val),
    "Name cannot contain numbers"
  );

// Create Account Schema
export const createAccountSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((val) => sanitizeEmail(val)),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  accountType: accountTypeSchema,
  referralCode: z.string().optional().transform((val) => val ? sanitizeString(val) : val),
  promoCode: z.string().optional().transform((val) => val ? sanitizeString(val) : val),
});

// Email Verification Schema
export const emailVerificationSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

// PIN Setup Schema
export const pinSetupSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
  confirmPin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

// Biodata Schema - NIN/confirmNin required only when nationality is Nigeria (NG)
export const biodataSchema = z
  .object({
    nationality: z.string().min(1, "Nationality is required").transform((val) => sanitizeString(val)),
    firstName: nameFieldSchema,
    lastName: nameFieldSchema,
    middleName: z
      .string()
      .optional()
      .transform((val) => val ? sanitizeName(val) : val)
      .refine(
        (val) => !val || /^[a-zA-Z\s'-]+$/.test(val),
        "Middle name can only contain letters, spaces, hyphens, and apostrophes"
      )
      .refine(
        (val) => !val || !/\d/.test(val),
        "Middle name cannot contain numbers"
      ),
    dateOfBirth: z.date({
      required_error: "Date of birth is required",
    }).refine((date) => {
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      return actualAge >= 18;
    }, "You must be at least 18 years old"),
    country: z.string().min(1, "Country is required").transform((val) => sanitizeString(val)),
    state: z
      .string()
      .min(1, "State is required")
      .transform((val) => sanitizeState(val))
      .refine((val) => val.length > 0, "State is required"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(200, "Address must be at most 200 characters")
      .transform((val) => sanitizeAddress(val).trim())
      .refine((val) => val.length > 0, "Address is required"),
    nin: z.string().optional(),
    confirmNin: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.nationality === "NG") {
      if (!data.nin || data.nin.length !== 11 || !/^\d+$/.test(data.nin)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NIN must be exactly 11 digits", path: ["nin"] });
      }
      if (!data.confirmNin || data.confirmNin.length !== 11 || !/^\d+$/.test(data.confirmNin)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please confirm your NIN (11 digits)", path: ["confirmNin"] });
      }
      if (data.nin && data.confirmNin && data.nin !== data.confirmNin) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NINs do not match", path: ["confirmNin"] });
      }
    }
  });

// Agent Profile Schema
export const agentProfileSchema = z.object({
  uniqueAgentId: z
    .string()
    .min(3, "Agent ID must be at least 3 characters")
    .max(20, "Agent ID must be at most 20 characters")
    .transform((val) => sanitizeAgentId(val))
    .refine(
      (val) => /^[a-zA-Z0-9_-]+$/.test(val),
      "Agent ID can only contain letters, numbers, hyphens, and underscores"
    ),
  projectedWeeklyVolume: z.string()
    .min(1, "Projected weekly volume is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount"),
  projectedWeeklyTransactions: z.string()
    .min(1, "Projected weekly transactions is required")
    .regex(/^\d+$/, "Please enter a valid number"),
});

// Phone Verification Schema
export const phoneVerificationSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

// Type exports
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type PinSetupInput = z.infer<typeof pinSetupSchema>;
export type BiodataInput = z.infer<typeof biodataSchema>;
export type PhoneVerificationInput = z.infer<typeof phoneVerificationSchema>;
export type AgentProfileInput = z.infer<typeof agentProfileSchema>;
