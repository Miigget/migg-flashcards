import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import ErrorDisplay from "./ErrorDisplay";
import type { ApiError } from "@/types";

describe("ErrorDisplay", () => {
  it("should render nothing when error is null", () => {
    render(<ErrorDisplay error={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should render the error message and status from ApiError object", async () => {
    const errorMessage = "Something went wrong";
    const errorStatus = 500;
    const apiError: ApiError = { message: errorMessage, status: errorStatus };
    render(<ErrorDisplay error={apiError} />);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(screen.getByText(/Wystąpił błąd/)).toBeInTheDocument();
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
      expect(alert).toHaveTextContent(`(Status: ${errorStatus})`);
    });
  });

  it("should render the error message without status if status is missing", () => {
    const errorMessage = "Minimal error";
    const apiError: ApiError = { message: errorMessage, status: 0 };
    render(<ErrorDisplay error={apiError} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(errorMessage);
    expect(alert).not.toHaveTextContent("(Status:");
  });

  it("should use the provided title and message props", () => {
    const customTitle = "Custom Error Title";
    const customMessage = "This is a specific error detail.";
    const apiError: ApiError = { message: "Generic error", status: 400 };
    render(<ErrorDisplay error={apiError} title={customTitle} message={customMessage} />);

    const alert = screen.getByRole("alert");
    expect(screen.getByText(new RegExp(customTitle))).toBeInTheDocument();
    expect(alert).toHaveTextContent(customMessage);
    expect(alert).not.toHaveTextContent("Generic error");
    expect(alert).toHaveTextContent("(Status: 400)");
  });

  it("should render the retry button when onRetry is provided", () => {
    const onRetryMock = vi.fn();
    const apiError: ApiError = { message: "Needs retry", status: 503 };
    render(<ErrorDisplay error={apiError} onRetry={onRetryMock} />);

    const retryButton = screen.getByRole("button", { name: /Spróbuj ponownie/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should call onRetry when the retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetryMock = vi.fn();
    const apiError: ApiError = { message: "Retry this", status: 503 };
    render(<ErrorDisplay error={apiError} onRetry={onRetryMock} />);

    const retryButton = screen.getByRole("button", { name: /Spróbuj ponownie/i });
    await user.click(retryButton);

    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("should apply the provided className", () => {
    const customClass = "my-custom-class";
    const apiError: ApiError = { message: "Styled error", status: 404 };
    render(<ErrorDisplay error={apiError} className={customClass} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("my-4");
    expect(alert).toHaveClass(customClass);
  });

  it("should render a default message if error message is missing", () => {
    const apiError: ApiError = { message: "", status: 401 };
    render(<ErrorDisplay error={apiError} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Nieznany błąd");
    expect(alert).toHaveTextContent("(Status: 401)");
  });
});
