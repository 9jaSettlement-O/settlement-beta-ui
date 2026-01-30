import { create } from "zustand";
import type { AccountType, OnboardingState } from "@/types/onboarding.types";
import {
  saveOnboardingProgress,
  loadOnboardingProgress,
  clearOnboardingProgress,
  type SafeBiodata,
} from "@/utils/onboarding-progress.util";

interface OnboardingStore extends OnboardingState {
  currentStep: string;
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
  restoreProgress: () => void;
  hydrateFromAuth: (userId: string, userType: string) => void;
  /** Reset only account-creation state so flow starts at Create Account (email/password). Used when user clicks Proceed from Select Account Type. */
  startAccountCreationFlow: () => void;
  reset: () => void;
}

const initialState: OnboardingState & { currentStep: string } = {
  accountType: null,
  email: "",
  isEmailVerified: false,
  isAccountCreated: false,
  uid: null,
  pinSetup: false,
  kycCompleted: false,
  currentStep: "",
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
    }
  : initialState;

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialData,
  biodata: savedProgress?.biodata,
  agentProfile: savedProgress?.agentProfile,
  businessDetails: savedProgress?.businessDetails,
  phone: savedProgress?.phone,
  phoneVerified: savedProgress?.phoneVerified ?? false,
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
        currentStep: "/create-account",
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
        currentStep: "/create-account",
        pinSetup: false,
        biodata: undefined,
        agentProfile: undefined,
        businessDetails: undefined,
        phone: undefined,
        phoneVerified: false,
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
      });
    }
  },
  hydrateFromAuth: (userId: string, userType: string) => {
    const accountType = (
      userType === "individual" || userType === "agent" || userType === "business"
        ? userType
        : "individual"
    ) as AccountType;
    const progress = loadOnboardingProgress();
    const matchesUser = progress && progress.uid === userId;
    set({
      uid: userId,
      accountType,
      isEmailVerified: true,
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
    if (matchesUser) {
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
      });
    }
  },
  startAccountCreationFlow: () => {
    set({
      uid: null,
      email: "",
      isEmailVerified: false,
      pinSetup: false,
      currentStep: "/create-account",
    });
    saveOnboardingProgress({
      accountType: get().accountType,
      email: "",
      uid: null,
      isEmailVerified: false,
      currentStep: "/create-account",
      pinSetup: false,
      biodata: get().biodata,
      agentProfile: get().agentProfile,
      businessDetails: get().businessDetails,
      phone: get().phone,
      phoneVerified: get().phoneVerified,
    });
  },
  reset: () => {
    clearOnboardingProgress();
    set(initialState);
  },
}));
