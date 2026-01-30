import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  className?: string;
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const currentIndex = steps.findIndex((s) => s.current);
  const totalSteps = steps.length;
  const totalSegments = totalSteps - 1;
  
  // Calculate progress: how many segments are completed
  let progressSegments = 0;
  if (completedCount === totalSteps) {
    progressSegments = totalSegments; // All completed
  } else if (currentIndex >= 0) {
    progressSegments = currentIndex; // Progress to current step
  } else if (completedCount > 0) {
    progressSegments = completedCount; // Progress to last completed
  }

  // Calculate progress width as percentage
  const progressWidth = totalSegments > 0 
    ? (progressSegments / totalSegments) * 100 
    : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Background line */}
        <div 
          className="absolute top-4 left-0 right-0 h-0.5 bg-muted"
          style={{
            left: '1rem',
            right: '1rem',
            transform: 'translateY(-50%)',
          }}
        />
        
        {/* Progress line - deep ash color */}
        {progressWidth > 0 && (
          <div
            className="absolute top-4 h-0.5 transition-all duration-300"
            style={{
              left: '1rem',
              width: `calc(${progressWidth}% * (100% - 2rem) / 100)`,
              transform: 'translateY(-50%)',
              backgroundColor: '#4A5568', // Deep ash color
            }}
          />
        )}
        
        {/* Steps - grid layout for perfect alignment */}
        <div 
          className="relative grid gap-0"
          style={{ gridTemplateColumns: `repeat(${totalSteps}, 1fr)` }}
        >
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isCurrent = step.current;
            const isActive = isCompleted || isCurrent;
            
            return (
              <div 
                key={step.id} 
                className="relative z-10 flex flex-col items-center justify-start"
              >
                {/* Circle - smaller size */}
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors duration-200 bg-background",
                    isCompleted
                      ? "border-[#4A5568] bg-[#4A5568] text-white"
                      : isCurrent
                        ? "border-[#4A5568] bg-[#4A5568]/10 text-[#4A5568]"
                        : "border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center whitespace-nowrap",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressBar({ currentStep, totalSteps, className }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
