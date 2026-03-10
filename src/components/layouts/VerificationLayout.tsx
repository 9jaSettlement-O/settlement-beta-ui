import { type ReactNode, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLogo from "@/components/AppLogo";
import { ProgressStepper } from "@/components/ui/progress";
import { DecorativeLogoBackground } from "@/components/onboarding/DecorativeLogoBackground";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface VerificationLayoutProps {
  steps: Step[];
  children: ReactNode;
  currentStep: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function VerificationLayout({
  steps,
  children,
  currentStep,
  maxWidth = "2xl",
}: VerificationLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  // Track previous step index for direction detection
  const previousStepIndexRef = useRef<number>(-1);
  
  // Determine current step index
  const currentStepIndex = steps.findIndex((s) => s.current);
  
  // Calculate direction (forward = 1, backward = -1, initial = 1)
  const direction = previousStepIndexRef.current === -1 
    ? 1 
    : currentStepIndex > previousStepIndexRef.current 
      ? 1 
      : currentStepIndex < previousStepIndexRef.current 
        ? -1 
        : 1;
  
  // Update previous step index after direction is calculated
  useEffect(() => {
    if (currentStepIndex >= 0) {
      previousStepIndexRef.current = currentStepIndex;
    }
  }, [currentStepIndex]);

  // Animation variants based on direction
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start pt-8 pb-8 px-4 bg-background">
      <DecorativeLogoBackground />
      <div className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} flex flex-col`}>
        {/* Fixed Header - Logo - No animation, stays in place */}
        <div className="flex flex-col items-center flex-shrink-0 mb-8">
          <AppLogo className="mb-6" />
        </div>

        {/* Fixed Progress Stepper - Updates smoothly without animation wrapper */}
        {steps.length > 0 && (
          <div className="px-4 flex-shrink-0 mb-8">
            <ProgressStepper steps={steps} />
          </div>
        )}

        {/* Animated Content Area - Only this section animates, logo/stepper stay fixed */}
        <div className="w-full relative flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
