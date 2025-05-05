import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RegisterForm } from "./RegisterForm"; // Named import
import { toast } from "sonner";

// Mock the toast module
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(), // Add success mock if used in the component
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
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

describe("RegisterForm", () => {
  const user = userEvent.setup();

  it("renders the register form correctly", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument(); // Use regex for exact match
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toBeInTheDocument();
  });

  it("allows user to input registration details", async () => {
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.type(screen.getByLabelText(/Confirm Password/i), "password123");

    expect(screen.getByLabelText(/Email/i)).toHaveValue("test@example.com");
    expect(screen.getByLabelText(/^Password$/i)).toHaveValue("password123");
    expect(screen.getByLabelText(/Confirm Password/i)).toHaveValue("password123");
  });

  it("shows validation errors for empty fields on submit", async () => {
    render(<RegisterForm />);
    const submitButton = screen.getByRole("button", { name: /Register/i });

    await user.click(submitButton);

    // Check for the specific error message shown by Zod for invalid format when empty
    expect(await screen.findByText(/Invalid email address/i)).toBeVisible();
    expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeVisible();
    expect(await screen.findByText(/Please confirm your password/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for mismatched passwords", async () => {
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.type(screen.getByLabelText(/Confirm Password/i), "password456"); // Mismatched
    const submitButton = screen.getByRole("button", { name: /Register/i });

    await user.click(submitButton);

    expect(await screen.findByText(/Passwords do not match/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits the form, calls fetch, shows success toast, and redirects on successful registration", async () => {
    const successMsg = "Please check your email to verify your account.";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: successMsg }),
    });

    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.type(screen.getByLabelText(/Confirm Password/i), "password123");
    const submitButton = screen.getByRole("button", { name: /Register/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });
    });

    // Check for success toast
    expect(toast.success).toHaveBeenCalledWith("Registration Initiated", {
      description: successMsg,
    });

    // Check if redirection happened
    await waitFor(
      () => {
        expect(window.location.href).toBe("/auth/login");
      },
      { timeout: 3000 }
    );

    expect(screen.queryByText(/Passwords do not match/i)).not.toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows loading state during submission", async () => {
    let resolveFetch: (value: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.type(screen.getByLabelText(/Confirm Password/i), "password123");
    const submitButton = screen.getByRole("button", { name: /Register/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      // Check for loading indicator SVG icon
      const svgIcon = submitButton.querySelector("svg");
      expect(svgIcon).toBeInTheDocument();
      // Optional: Check for animate-spin class if needed
      expect(svgIcon).toHaveClass("animate-spin");
    });

    // @ts-expect-error - Mocking promise resolution for loading state test
    resolveFetch({ ok: true, json: async () => ({ message: "Success" }) });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("displays API error message and calls toast.error on failed registration", async () => {
    const apiErrorMsg = "Email already exists";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409, // Conflict
      json: async () => ({ error: apiErrorMsg }),
    });

    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/Email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/^Password$/i), "password123");
    await user.type(screen.getByLabelText(/Confirm Password/i), "password123");
    const submitButton = screen.getByRole("button", { name: /Register/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Check if toast.error was called - updated based on component implementation
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration Failed", {
        description: apiErrorMsg,
      });
    });

    expect(window.location.href).toBe(""); // No redirect on error

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    expect(toast.success).not.toHaveBeenCalled();
  });
});
