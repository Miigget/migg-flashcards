import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ForgotPasswordForm } from "./ForgotPasswordForm"; // Named import
import { toast } from "sonner";

// Mock the toast module
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window.location (though not typically used in forgot password)
const originalLocation = window.location;

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...originalLocation, assign: vi.fn(), href: "" },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: originalLocation,
  });
});

describe("ForgotPasswordForm", () => {
  const user = userEvent.setup();

  it("renders the forgot password form correctly", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send Reset Link/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toBeInTheDocument();
  });

  it("allows user to input email", async () => {
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, "test@example.com");
    expect(emailInput).toHaveValue("test@example.com");
  });

  it("shows validation error for empty email on submit", async () => {
    render(<ForgotPasswordForm />);
    const submitButton = screen.getByRole("button", { name: /Send Reset Link/i });

    await user.click(submitButton);

    expect(await screen.findByText(/Invalid email address/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: /Send Reset Link/i });

    await user.type(emailInput, "not-an-email");
    await user.click(submitButton);

    expect(await screen.findByText(/Invalid email address/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits the form, calls fetch, and shows success toast on successful request", async () => {
    const successMsg = "Password reset link sent";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: successMsg }),
    });

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: /Send Reset Link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "test@example.com" }),
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Check your email", {
      description: successMsg,
    });

    expect(screen.queryByText(/Invalid email address/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Failed to send/i)).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(submitButton).not.toBeDisabled();
  });

  it("shows loading state during submission", async () => {
    let resolveFetch: (value: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: /Send Reset Link/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /Sending.../i })).toBeInTheDocument();
    });

    // @ts-expect-error - Mocking promise resolution for loading state test
    resolveFetch({ ok: true, json: async () => ({}) });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Send Reset Link/i })).toBeInTheDocument();
    });
  });

  it("displays API error message and calls toast.error on failed request", async () => {
    const apiErrorMsg = "User not found";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: apiErrorMsg }),
    });

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: /Send Reset Link/i });

    await user.type(emailInput, "notfound@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(toast.error).toHaveBeenCalledWith("Error", { description: apiErrorMsg });

    expect(submitButton).not.toBeDisabled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
