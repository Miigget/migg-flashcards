import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResetPasswordForm } from "./ResetPasswordForm"; // Named import
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

// Mock window.location more robustly
let currentHref = "";
const originalLocation = window.location;

beforeEach(() => {
  vi.resetAllMocks();
  currentHref = ""; // Reset href for each test
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true, // Ensure we can reconfigure or delete later
    value: {
      ...originalLocation, // Keep existing properties
      assign: vi.fn((url) => {
        currentHref = url;
      }), // Mock assign
      replace: vi.fn((url) => {
        currentHref = url;
      }), // Mock replace
      // Use getter/setter for href
      set href(url: string) {
        currentHref = url;
      },
      get href(): string {
        return currentHref;
      },
    },
  });
  vi.useRealTimers();
});

afterEach(() => {
  // Restore original window.location
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: originalLocation,
  });
});

describe("ResetPasswordForm", () => {
  const user = userEvent.setup();

  it("renders the reset password form correctly", () => {
    render(<ResetPasswordForm />);

    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change Password/i })).toBeInTheDocument();
  });

  it("allows user to input new password and confirmation", async () => {
    const user = userEvent.setup({
      // Configure userEvent with a shorter delay to prevent timeout
      delay: 1,
    });

    render(<ResetPasswordForm />);

    const newPasswordInput = screen.getByLabelText(/^New Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);

    await user.type(newPasswordInput, "newSecurePassword123");
    await user.type(confirmPasswordInput, "newSecurePassword123");

    // Proste asercje bez waitFor
    expect(newPasswordInput).toHaveValue("newSecurePassword123");
    expect(confirmPasswordInput).toHaveValue("newSecurePassword123");
  });

  it("shows validation errors for empty fields on submit", async () => {
    render(<ResetPasswordForm />);
    const submitButton = screen.getByRole("button", { name: /Change Password/i });

    await user.click(submitButton);
    // vi.runOnlyPendingTimers(); // Removed

    expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeVisible();
    expect(await screen.findByText(/Please confirm your new password/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for password too short", async () => {
    render(<ResetPasswordForm />);
    const user = userEvent.setup({
      delay: 1, // Set a minimal delay
    });

    await user.type(screen.getByLabelText(/^New Password$/i), "short");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "short");
    const submitButton = screen.getByRole("button", { name: /Change Password/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeVisible();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for mismatched passwords", async () => {
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/^New Password$/i), "newSecurePassword123");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "mismatchedPassword456");
    const submitButton = screen.getByRole("button", { name: /Change Password/i });

    await user.click(submitButton);

    expect(await screen.findByText(/Passwords do not match/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits the form, calls fetch, shows success toast, and redirects after delay", async () => {
    // Removed fake timers to rely on async/await and waitFor
    // vi.useFakeTimers({ toFake: ['setTimeout'] });
    // try {
    const successMsg = "Password updated successfully.";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: successMsg }),
    });

    render(<ResetPasswordForm />);
    const newPasswordInput = screen.getByLabelText(/^New Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    const submitButton = screen.getByRole("button", { name: /Change Password/i });

    await user.type(newPasswordInput, "newSecurePassword123");
    await user.type(confirmPasswordInput, "newSecurePassword123");
    await user.click(submitButton);

    // Assert fetch called immediately after click
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "newSecurePassword123" }),
    });

    // Check for success toast (should appear after fetch resolves)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Success", { description: successMsg });
    });

    // Check that redirect hasn't happened immediately after toast
    expect(window.location.href).toBe("");

    // Check if redirection happened after the actual setTimeout duration
    // waitFor will wait for the timeout and the subsequent update
    await waitFor(
      () => {
        expect(window.location.href).toBe("/auth/login");
      },
      { timeout: 2000 }
    ); // Explicitly increase timeout to 2 seconds

    expect(toast.error).not.toHaveBeenCalled();
    // } finally {
    // Restore real timers after this test - No longer needed as we didn't switch
    // vi.useRealTimers();
    // }
  });

  it("shows loading state during submission", async () => {
    let resolveFetch: (value: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText(/^New Password$/i), "newSecurePassword123");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "newSecurePassword123");
    const submitButton = screen.getByRole("button", { name: /Change Password/i });

    await user.click(submitButton);

    // Wait for loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      // Check specifically for the loading text/indicator if possible
      expect(screen.getByRole("button", { name: /Changing.../i })).toBeInTheDocument();
    });

    // Resolve the promise directly
    const mockResponse = { ok: true, json: async () => ({ message: "Success" }) };
    // @ts-expect-error - Mocking promise resolution
    resolveFetch(mockResponse);

    // Wait specifically for the button to become enabled again
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    // Optionally, check if loading text is gone
    expect(screen.queryByRole("button", { name: /Changing.../i })).not.toBeInTheDocument();
  });

  it("displays API error message and calls toast.error on failed request", async () => {
    const apiErrorMsg = "Invalid or expired token";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: apiErrorMsg }),
    });

    render(<ResetPasswordForm />);
    const user = userEvent.setup({ delay: 1 }); // Use a shorter delay

    await user.type(screen.getByLabelText(/^New Password$/i), "newSecurePassword123");
    await user.type(screen.getByLabelText(/Confirm New Password/i), "newSecurePassword123");
    const submitButton = screen.getByRole("button", { name: /Change Password/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Check if toast.error was called, waiting for it
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error", { description: apiErrorMsg });
    });

    // Wait specifically for button to become enabled again
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    expect(window.location.href).toBe(""); // No redirect on error
    expect(toast.success).not.toHaveBeenCalled();
  });
});
