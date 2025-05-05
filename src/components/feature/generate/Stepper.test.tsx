import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Stepper from "./Stepper"; // Assuming Stepper is the default export
import "@testing-library/jest-dom"; // Import jest-dom matchers

// No need for a custom TestStep type, steps is string[]

describe("Stepper Component", () => {
  const mockSteps: string[] = ["Input Text", "Review Candidates", "Save Selection"];

  it("should render all steps with their names", () => {
    render(<Stepper steps={mockSteps} currentStep={1} />); // Need currentStep

    mockSteps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it("should correctly indicate the current step with primary background", () => {
    render(<Stepper steps={mockSteps} currentStep={2} />);

    // The current step's container div should have 'bg-primary'
    const currentStepText = screen.getByText("Review Candidates");
    // Find the parent div containing the step number/icon and text
    const stepContainer = currentStepText.closest(".flex.flex-col.items-center");
    expect(stepContainer).toBeInTheDocument();
    // Find the circle div within the container
    const circleDiv = stepContainer?.querySelector("div[class*='w-8 h-8']");
    expect(circleDiv).toHaveClass("bg-primary");
    expect(circleDiv).not.toHaveClass("bg-primary/70");
    expect(circleDiv).not.toHaveClass("bg-secondary");
    expect(circleDiv).toHaveTextContent("2"); // Check step number
  });

  it("should correctly indicate completed steps with bg-primary/70 and checkmark", () => {
    render(<Stepper steps={mockSteps} currentStep={3} />); // Step 1 and 2 are completed

    // Test Step 1 (Completed)
    const completedStep1Text = screen.getByText("Input Text");
    const step1Container = completedStep1Text.closest(".flex.flex-col.items-center");
    const circle1Div = step1Container?.querySelector("div[class*='w-8 h-8']");
    expect(circle1Div).toHaveClass("bg-primary/70");
    expect(circle1Div).not.toHaveClass("bg-primary");
    expect(circle1Div).not.toHaveClass("bg-secondary");
    // Check for SVG presence (checkmark)
    expect(circle1Div?.querySelector("svg")).toBeInTheDocument();
  });

  it("should correctly indicate upcoming steps with secondary background", () => {
    render(<Stepper steps={mockSteps} currentStep={1} />); // Steps 2 and 3 are upcoming

    // Test Step 3 (Upcoming)
    const upcomingStep3Text = screen.getByText("Save Selection");
    const step3Container = upcomingStep3Text.closest(".flex.flex-col.items-center");
    const circle3Div = step3Container?.querySelector("div[class*='w-8 h-8']");
    expect(circle3Div).toHaveClass("bg-secondary");
    expect(circle3Div).not.toHaveClass("bg-primary");
    expect(circle3Div).not.toHaveClass("bg-primary/70");
    expect(circle3Div).toHaveTextContent("3"); // Check step number
  });

  it("should handle an empty list of steps gracefully", () => {
    const { container } = render(<Stepper steps={[]} currentStep={1} />); // Get container
    // The main container should still render
    const mainDiv = container.querySelector("div.w-full.py-4"); // Select main container by class
    expect(mainDiv).toBeInTheDocument();

    // Check that no step text is rendered
    mockSteps.forEach((step) => {
      expect(screen.queryByText(step)).not.toBeInTheDocument();
    });
    // Check if the flex container for steps is empty or doesn't exist
    const stepFlexContainer = mainDiv?.querySelector(".flex.justify-between");
    expect(stepFlexContainer?.children.length).toBe(0);
  });

  it("should render correct connecting lines based on current step", () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={2} />); // Get container

    // Line between step 1 and 2 should be completed (bg-primary/70)
    // Line between step 2 and 3 should be active (bg-primary/30)
    const lineContainer = container.querySelector("[class*='relative'][class*='flex'][class*='h-0.5'][class*='mt-4']"); // Use attribute selector
    expect(lineContainer).toBeInTheDocument(); // Check if line container exists
    expect(lineContainer?.children.length).toBe(2); // 2 lines for 3 steps

    if (lineContainer?.children) {
      // Find the div elements representing lines more reliably
      const lines = Array.from(lineContainer.children).filter((el) => el.tagName === "DIV");
      expect(lines[0]).toHaveClass("bg-primary/70"); // Line 1-2 completed
      expect(lines[1]).toHaveClass("bg-secondary/50"); // Line 2-3 should be inactive when step 2 is current
    }
  });

  it("should render correct connecting lines when first step is current", () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={1} />); // Get container

    // All lines should be inactive (bg-secondary/50)
    const lineContainer = container.querySelector("[class*='relative'][class*='flex'][class*='h-0.5'][class*='mt-4']"); // Use attribute selector
    expect(lineContainer).toBeInTheDocument();
    if (lineContainer?.children) {
      const lines = Array.from(lineContainer.children).filter((el) => el.tagName === "DIV");
      expect(lines[0]).toHaveClass("bg-secondary/50");
      expect(lines[1]).toHaveClass("bg-secondary/50");
    }
  });

  it("should render correct connecting lines when last step is current", () => {
    const { container } = render(<Stepper steps={mockSteps} currentStep={3} />); // Get container

    // All lines should be completed (bg-primary/70)
    const lineContainer = container.querySelector("[class*='relative'][class*='flex'][class*='h-0.5'][class*='mt-4']"); // Use attribute selector
    expect(lineContainer).toBeInTheDocument();
    if (lineContainer?.children) {
      const lines = Array.from(lineContainer.children).filter((el) => el.tagName === "DIV");
      expect(lines[0]).toHaveClass("bg-primary/70");
      expect(lines[1]).toHaveClass("bg-primary/70");
    }
  });

  // Add more tests if the stepper has interactive elements, like clicking on steps
  // (Stepper component seems purely presentational based on the code)
});
