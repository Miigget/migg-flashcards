import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Step1_TextInput from "./Step1_TextInput";
import "@testing-library/jest-dom";

// Mock child components that are not the focus of this test
vi.mock("../../ui/CharacterCounter", () => ({
  default: ({ current, max }: { current: number; max: number }) => (
    <div data-testid="char-counter">{`${current}/${max}`}</div>
  ),
}));
vi.mock("../../ui/ErrorMessage", () => ({
  default: ({ error }: { error: string | object }) => (
    <div data-testid="error-message">{typeof error === "string" ? error : JSON.stringify(error)}</div>
  ),
}));
vi.mock("../../ui/LoadingIndicator", () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="loading-indicator" role="status">
      {text}
    </div>
  ),
}));

describe("Step1_TextInput Component", () => {
  const mockOnTextChange = vi.fn();
  const mockOnGenerateClick = vi.fn();
  const mockOnRetryGenerate = vi.fn();
  const minLength = 100; // Assuming MIN_TEXT_LENGTH is 100 from component code

  // Helper function to generate long text
  const generateText = (length: number) => "a".repeat(length);
  const validText = generateText(minLength + 10);
  const shortText = generateText(minLength - 10);

  beforeEach(() => {
    // Reset mocks before each test
    mockOnTextChange.mockClear();
    mockOnGenerateClick.mockClear();
    mockOnRetryGenerate.mockClear();
  });

  it("should render the textarea, title, description, and initial button state", () => {
    render(
      <Step1_TextInput
        text=""
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );

    expect(screen.getByRole("heading", { name: /Wprowadź tekst/i })).toBeInTheDocument();
    expect(screen.getByText(/Wprowadź tekst, na podstawie którego AI wygeneruje fiszki/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Wklej lub wpisz tutaj swój tekst/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled(); // Initially disabled
    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
    expect(screen.getByTestId("char-counter")).toHaveTextContent(`0/10000`); // Assuming MAX_TEXT_LENGTH is 10000
  });

  it("should call onTextChange when text is typed into the textarea", async () => {
    const user = userEvent.setup();
    render(
      <Step1_TextInput
        text=""
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    const textarea = screen.getByPlaceholderText(/Wklej lub wpisz tutaj swój tekst/i);

    await user.type(textarea, "test");

    // Check if onTextChange was called correctly by React
    // We assert the mock function passed to the component
    expect(mockOnTextChange).toHaveBeenCalled();
    // Note: We don't check the argument here as userEvent.type calls onChange multiple times.
    // Instead, we check the final state in other tests by controlling the 'text' prop.
  });

  it("should enable the submit button only when text is valid (correct length, no validation error)", () => {
    // Test Case 1: Text too short
    const { rerender } = render(
      <Step1_TextInput
        text={shortText}
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();

    // Test Case 2: Valid text
    rerender(
      <Step1_TextInput
        text={validText}
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeEnabled();

    // Test Case 3: Valid text but with validation error
    rerender(
      <Step1_TextInput
        text={validText}
        validationError="Some validation error"
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
    expect(screen.getByTestId("error-message")).toHaveTextContent("Some validation error");

    // Test Case 4: Valid text but loading
    rerender(
      <Step1_TextInput
        text={validText}
        validationError={null}
        isLoading={true} // Loading state
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
  });

  it("should call onGenerateClick when the enabled button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Step1_TextInput
        text={validText} // Button should be enabled
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );

    const submitButton = screen.getByRole("button", { name: /Generuj fiszki/i });
    expect(submitButton).toBeEnabled(); // Pre-check

    await user.click(submitButton);

    expect(mockOnGenerateClick).toHaveBeenCalledTimes(1);
  });

  it("should disable textarea and button, and show loading indicator when isLoading is true", () => {
    render(
      <Step1_TextInput
        text={validText}
        validationError={null}
        isLoading={true} // Loading state
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );

    expect(screen.getByPlaceholderText(/Wklej lub wpisz tutaj swój tekst/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled();
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("loading-indicator")).toHaveTextContent(/Generowanie fiszek/i);
  });

  it("should display validation error message when validationError prop is set", () => {
    const errorMsg = "Tekst jest za krótki.";
    render(
      <Step1_TextInput
        text={shortText}
        validationError={errorMsg}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message")).toHaveTextContent(errorMsg);
    expect(screen.getByRole("button", { name: /Generuj fiszki/i })).toBeDisabled(); // Also check button state
  });

  it("should display API error message with retry button when apiError prop is set", () => {
    const apiErrorObj = { message: "API failed", code: "500" };
    render(
      <Step1_TextInput
        text={validText}
        validationError={null}
        isLoading={false}
        apiError={apiErrorObj}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByTestId("error-message")).toHaveTextContent(JSON.stringify(apiErrorObj));
    // Assuming the mocked ErrorMessage component doesn't render the retry button
    // To test the retry button, we might need a more sophisticated mock or test the ErrorMessage component itself
    // However, we can check if the onRetryGenerate is passed down correctly if ErrorMessage allowed inspection
  });

  // We can't easily test the onRetryGenerate callback without a more complex ErrorMessage mock
  // or by directly testing the ErrorMessage component to ensure it calls its onRetry prop.

  it("should update character counter based on text prop", () => {
    const { rerender } = render(
      <Step1_TextInput
        text=""
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByTestId("char-counter")).toHaveTextContent(`0/10000`);

    rerender(
      <Step1_TextInput
        text="Hello"
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByTestId("char-counter")).toHaveTextContent(`5/10000`);

    rerender(
      <Step1_TextInput
        text={validText} // Length 110
        validationError={null}
        isLoading={false}
        apiError={null}
        onTextChange={mockOnTextChange}
        onGenerateClick={mockOnGenerateClick}
        onRetryGenerate={mockOnRetryGenerate}
      />
    );
    expect(screen.getByTestId("char-counter")).toHaveTextContent(`110/10000`);
  });
});
