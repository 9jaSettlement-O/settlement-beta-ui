import { create } from "zustand";
import type {
  AccountType,
  OnboardingState,
  OnboardingStep,
  OnboardingRequirement,
} from "@/types/onboarding.types";
import {
  saveOnboardingProgress,
  loadOnboardingProgress,
  clearOnboardingProgress,
  type SafeBiodata,
} from "@/utils/onboarding-progress.util";

const STEP_ORDER: OnboardingStep[] = [
  "account_type",
  "create_account",
  "verify_email",
  "individual",
  "agent",
  "business",
];

interface OnboardingStore extends OnboardingState {
  currentStep: string;
  requirements: OnboardingRequirement[];
  loading: boolean;
  error: string | null;
  biodata?: SafeBiodata;
  agentProfile?: {
    uniqueAgentId?: string;
    projectedWeeklyVolume?: string;
    projectedWeeklyTransactions?: string;
  };
  businessDetails?: {
    country?: string;
    businessName?: string;
  };
  phone?: string;
  phoneVerified?: boolean;
  setAccountType: (type: AccountType) => void;
  setRequirements: (requirements: OnboardingRequirement[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  clearAccountSelection: () => void;
  setEmail: (email: string) => void;
  setEmailVerified: (verified: boolean) => void;
  setAccountCreated: (created: boolean) => void;
  setUid: (uid: string | null) => void;
  setPinSetup: (setup: boolean) => void;
  setKycCompleted: (completed: boolean) => void;
  setCurrentStep: (step: string) => void;
  setBiodata: (biodata: OnboardingStore["biodata"]) => void;
  setAgentProfile: (profile: OnboardingStore["agentProfile"]) => void;
  setBusinessDetails: (details: OnboardingStore["businessDetails"]) => void;
  setPhone: (phone: string, verified?: boolean) => void;
  /** In-memory only (not persisted): password entered on Create Account, used after OTP verify to call signup. */
  pendingPassword: string | null;
  setPendingPassword: (password: string | null) => void;
  pendingReferralCode: string;
  pendingPromoCode: string;
  setPendingReferralCode: (code: string) => void;
  setPendingPromoCode: (code: string) => void;
  restoreProgress: () => void;
  hydrateFromAuth: (userId: string, userType: string, kycCompletedFromBackend?: boolean) => void;
  /** Reset only account-creation state so flow starts at Create Account (email/password). Used when user clicks Proceed from Select Account Type. */
  startAccountCreationFlow: () => void;
  reset: () => void;
  resetOnboarding: () => void;
}

const initialState: OnboardingState & {
  currentStep: string;
  requirements: OnboardingRequirement[];
  loading: boolean;
  error: string | null;
  pendingPassword: string | null;
  pendingReferralCode: string;
  pendingPromoCode: string;
} = {
  accountType: null,
  email: "",
  isEmailVerified: false,
  isAccountCreated: false,
  uid: null,
  pinSetup: false,
  kycCompleted: false,
  currentStep: "",
  requirements: [],
  loading: false,
  error: null,
  pendingPassword: null,
  pendingReferralCode: "",
  pendingPromoCode: "",
};

const savedProgress = loadOnboardingProgress();
const initialData = savedProgress
  ? {
      ...initialState,
      accountType: savedProgress.accountType,
      email: savedProgress.email,
      isEmailVerified: savedProgress.isEmailVerified,
      uid: savedProgress.uid,
      currentStep: savedProgress.currentStep,
      pinSetup: savedProgress.pinSetup ?? false,
      biodata: savedProgress.biodata,
      agentProfile: savedProgress.agentProfile,
      businessDetails: savedProgress.businessDetails,
      phone: savedProgress.phone,
      phoneVerified: savedProgress.phoneVerified,
      requirements: savedProgress.requirements ?? [],
    }
  : initialState;

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialData,
  biodata: savedProgress?.biodata,
  agentProfile: savedProgress?.agentProfile,
  businessDetails: savedProgress?.businessDetails,
  phone: savedProgress?.phone,
  phoneVerified: savedProgress?.phoneVerified ?? false,
  requirements: initialData.requirements,
  loading: false,
  error: null,
  pendingPassword: null,
  pendingReferralCode: "",
  pendingPromoCode: "",

  setPendingPassword: (password) => set({ pendingPassword: password }),
  setPendingReferralCode: (code) => set({ pendingReferralCode: code }),
  setPendingPromoCode: (code) => set({ pendingPromoCode: code }),

  setRequirements: (requirements) => set({ requirements }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  nextStep: () => {
    const { currentStep, accountType } = get();
    const idx = STEP_ORDER.indexOf(currentStep as OnboardingStep);
    if (idx < 0 || idx >= STEP_ORDER.length - 1) return;
    let next: string = STEP_ORDER[idx + 1];
    if (currentStep === "verify_email" && accountType) {
      next = accountType;
    }
    set({ currentStep: next, error: null });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: next,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },

  prevStep: () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep as OnboardingStep);
    if (idx <= 0) return;
    const prev = STEP_ORDER[idx - 1];
    set({ currentStep: prev, error: null });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: prev,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },

  setAccountType: (type) => {
    const previousType = get().accountType;
    const isNewChoice = previousType != null && previousType !== type;
    if (isNewChoice) {
      const cleared = {
        accountType: type,
        email: "",
        isEmailVerified: false,
        isAccountCreated: false,
        uid: null,
        currentStep: "create_account",
        biodata: undefined,
        agentProfile: undefined,
        businessDetails: undefined,
        phone: undefined,
        phoneVerified: false,
      };
      set(cleared);
    saveOnboardingProgress({
        accountType: type,
        email: "",
        uid: null,
        isEmailVerified: false,
        currentStep: "create_account",
        pinSetup: false,
        biodata: undefined,
        agentProfile: undefined,
        businessDetails: undefined,
        phone: undefined,
        phoneVerified: false,
        requirements: get().requirements,
      });
    } else {
    set({ accountType: type });
    saveOnboardingProgress({
      accountType: type,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  }
  },
  clearAccountSelection: () => {
    set({
      accountType: null,
      email: "",
      uid: null,
      currentStep: "/select-account-type",
    });
    saveOnboardingProgress({
      accountType: null,
      email: "",
      uid: null,
      isEmailVerified: false,
      currentStep: "/select-account-type",
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setEmail: (email) => {
    set({ email });
    saveOnboardingProgress({
      accountType: get().accountType,
      email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setEmailVerified: (verified) => {
    set({ isEmailVerified: verified });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: verified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setAccountCreated: (created) => {
    set({ isAccountCreated: created });
  },
  setUid: (uid) => {
    const previousUid = get().uid;
    const isNewAccount =
      (previousUid != null && previousUid !== uid) || (previousUid === null && uid != null);
    const cleared = isNewAccount
      ? {
          uid,
          biodata: undefined,
          agentProfile: undefined,
          businessDetails: undefined,
          phone: undefined,
          phoneVerified: false,
          pinSetup: false,
        }
      : { uid };
    set(cleared);
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: isNewAccount ? false : get().pinSetup,
      biodata: isNewAccount ? undefined : get().biodata,
      agentProfile: isNewAccount ? undefined : get().agentProfile,
      businessDetails: isNewAccount ? undefined : get().businessDetails,
      phone: isNewAccount ? undefined : get().phone,
      phoneVerified: isNewAccount ? false : get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setPinSetup: (setup) => {
    set({ pinSetup: setup });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: setup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setKycCompleted: (completed) => {
    set({ kycCompleted: completed });
    if (completed) {
      clearOnboardingProgress();
    }
  },
  setCurrentStep: (step) => {
    set({ currentStep: step });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: step,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setBiodata: (biodata) => {
    set({ biodata });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setAgentProfile: (profile) => {
    set({ agentProfile: profile });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: profile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setBusinessDetails: (details) => {
    set({ businessDetails: details });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: details,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  setPhone: (phone, verified = false) => {
    set({ phone, phoneVerified: verified });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: get().email,
      uid: get().uid,
      isEmailVerified: get().isEmailVerified,
      currentStep: get().currentStep,
      pinSetup: get().pinSetup,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone,
      phoneVerified: verified,
      requirements: get().requirements,
    });
  },
  restoreProgress: () => {
    const progress = loadOnboardingProgress();
    if (progress) {
      set({
        accountType: progress.accountType,
        email: progress.email,
        isEmailVerified: progress.isEmailVerified,
        uid: progress.uid,
        currentStep: progress.currentStep,
        pinSetup: progress.pinSetup ?? false,
        biodata: progress.biodata,
        agentProfile: progress.agentProfile,
        businessDetails: progress.businessDetails,
        phone: progress.phone,
        phoneVerified: progress.phoneVerified ?? false,
        requirements: progress.requirements ?? [],
      });
    }
  },
  hydrateFromAuth: (userId: string, userType: string, kycCompletedFromBackend?: boolean) => {
    const accountType = (
      userType === "individual" || userType === "agent" || userType === "business"
        ? userType
        : "individual"
    ) as AccountType;
    const progress = loadOnboardingProgress();
    const matchesUser = progress && progress.uid === userId;
    const isAlreadyVerified = kycCompletedFromBackend === true;
    set({
      uid: userId,
      accountType,
      isEmailVerified: true,
      ...(isAlreadyVerified ? { kycCompleted: true } : {}),
      ...(matchesUser
        ? {
            pinSetup: progress.pinSetup ?? false,
            biodata: progress.biodata,
            agentProfile: progress.agentProfile,
            businessDetails: progress.businessDetails,
            phone: progress.phone,
            phoneVerified: progress.phoneVerified ?? false,
            currentStep: progress.currentStep ?? `/kyc/${accountType}?uid=${userId}`,
          }
        : {
            pinSetup: false,
            biodata: undefined,
            agentProfile: undefined,
            businessDetails: undefined,
            phone: undefined,
            phoneVerified: false,
            currentStep: `/kyc/${accountType}?uid=${userId}`,
          }),
    });
    if (isAlreadyVerified) {
      clearOnboardingProgress();
    } else if (matchesUser) {
      saveOnboardingProgress({
        accountType: get().accountType,
        email: get().email,
        uid: get().uid,
        isEmailVerified: true,
        currentStep: get().currentStep,
        pinSetup: get().pinSetup,
        biodata: get().biodata,
        agentProfile: get().agentProfile,
        businessDetails: get().businessDetails,
        phone: get().phone,
        phoneVerified: get().phoneVerified,
        requirements: get().requirements,
      });
    }
  },
  startAccountCreationFlow: () => {
    set({
      uid: null,
      email: "",
      isEmailVerified: false,
      pinSetup: false,
      currentStep: "create_account",
    });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: "",
      uid: null,
      isEmailVerified: false,
      currentStep: "create_account",
      pinSetup: false,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
      requirements: get().requirements,
    });
  },
  reset: () => {
    clearOnboardingProgress();
    set(initialState);
  },

  resetOnboarding: () => {
    set({
      currentStep: "account_type",
      requirements: [],
      loading: false,
      error: null,
    });
  },
}));
