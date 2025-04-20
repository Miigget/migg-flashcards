import React from "react";

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;

          return (
            <div key={step} className="flex flex-col items-center w-1/3">
              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-primary/70 text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                  }
                `}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <div className="mt-2 text-sm font-medium text-center">{step}</div>
            </div>
          );
        })}
      </div>

      <div className="relative flex h-0.5 mt-4">
        {steps.map((_, index) => {
          if (index === steps.length - 1) return null;

          const isCompleted = currentStep > index + 1;
          const isActive = currentStep === index + 2;

          return (
            <div
              key={`line-${index}`}
              className={`h-full flex-1 ${isCompleted ? "bg-primary/70" : isActive ? "bg-primary/30" : "bg-secondary/50"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
