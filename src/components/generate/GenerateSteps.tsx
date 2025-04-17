import type { StepType } from "./types";

interface GenerateStepsProps {
  currentStep: StepType;
  onStepChange: (step: StepType) => void;
  isStepEnabled: (step: StepType) => boolean;
}

export const GenerateSteps = ({ currentStep, onStepChange, isStepEnabled }: GenerateStepsProps) => {
  const steps: { key: StepType; label: string }[] = [
    { key: "input", label: "Enter Text" },
    { key: "generating", label: "Generate" },
    { key: "review", label: "Review" },
  ];

  return (
    <div className="mb-8 flex justify-center">
      <div className="w-full max-w-md flex items-center">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full 
                text-sm font-medium transition-colors
                ${
                  currentStep === step.key
                    ? "bg-primary text-primary-foreground"
                    : isStepEnabled(step.key)
                      ? "bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                }
              `}
              onClick={() => isStepEnabled(step.key) && onStepChange(step.key)}
              disabled={!isStepEnabled(step.key)}
              aria-current={currentStep === step.key ? "step" : undefined}
            >
              {index + 1}
            </button>

            {/* Step Label */}
            <span
              className={`
                hidden sm:block ml-3 text-sm font-medium 
                ${
                  currentStep === step.key
                    ? "text-foreground"
                    : isStepEnabled(step.key)
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }
              `}
            >
              {step.label}
            </span>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-auto mx-2 h-0.5 sm:mx-4
                  ${index < steps.findIndex((s) => s.key === currentStep) ? "bg-primary" : "bg-muted"}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
