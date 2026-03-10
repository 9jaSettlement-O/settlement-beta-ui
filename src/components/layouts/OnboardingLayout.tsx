import { type ReactNode } from "react";
import AppLogo from "@/components/AppLogo";
import { ProgressStepper } from "@/components/ui/progress";
import { DecorativeLogoBackground } from "@/components/onboarding/DecorativeLogoBackground";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface OnboardingLayoutProps {
  steps?: Step[];
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  showStepper?: boolean;
}

export function OnboardingLayout({
  steps = [],
  children,
  maxWidth = "md",
  showStepper = true,
}: OnboardingLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start pt-8 pb-8 px-4 bg-background">
      <DecorativeLogoBackground />
      <div className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} space-y-8`}>
        {/* Header - Fixed position at top, doesn't move with content */}
        <div className="flex flex-col items-center flex-shrink-0">
          <AppLogo className="mb-6" />
        </div>

        {/* Progress Stepper - Fixed position */}
        {showStepper && steps.length > 0 && (
          <div className="px-4 flex-shrink-0">
            <ProgressStepper steps={steps} />
          </div>
        )}
        {/* Spacer to maintain layout when stepper is hidden */}
        {!showStepper && (
          <div className="px-4 flex-shrink-0 h-[52px]" aria-hidden="true" />
        )}

        {/* Content - Scrollable area */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </main>
  );
}
