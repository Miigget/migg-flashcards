import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoginForm } from "./LoginForm";
import { toast } from "sonner";

// Mock the toast module
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
const originalLocation = window.location;

beforeEach(() => {
  // Reset mocks and restore original window.location before each test
  vi.resetAllMocks();

  // Mock window.location assignment safely
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...originalLocation, assign: vi.fn(), href: "" }, // Add mock for assign if needed
  });
});

afterEach(() => {
  // Restore original window.location after each test
  Object.defineProperty(window, "location", {
    writable: true,
    value: originalLocation,
  });
});

describe("LoginForm", () => {
  const user = userEvent.setup();

  it("renders the login form correctly", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Forgot your password/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Register/i })).toBeInTheDocument();
  });

  it("allows user to input email and password", async () => {
    const user = userEvent.setup({
      // Configure userEvent with a shorter delay to prevent timeout
      delay: 1,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // Proste asercje bez waitFor
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("shows validation errors for empty fields on submit", async () => {
    render(<LoginForm />);
    const submitButton = screen.getByRole("button", { name: /Log in/i });

    await user.click(submitButton);

    // Use findByText as validation errors might appear asynchronously
    // Check for the specific error message shown by Zod for invalid format when empty
    expect(await screen.findByText(/Invalid email address/i)).toBeVisible();
    expect(await screen.findByText(/Password is required/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled(); // Fetch should not be called if validation fails
  });

  it("shows validation error for invalid email format", async () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Log in/i });

    await user.type(emailInput, "not-an-email");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(await screen.findByText(/Invalid email address/i)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits the form, calls fetch, and redirects on successful login", async () => {
    // Mock successful fetch response
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Login successful" }), // Or whatever the success response is
    });

    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Log in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Check if fetch was called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });
    });

    // Check if redirection happened
    await waitFor(() => {
      expect(window.location.href).toBe("/");
    });

    // Check that no error messages are shown
    expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Password is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Login failed/i)).not.toBeInTheDocument(); // Check for general error message
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows loading state and disables button during submission", async () => {
    // Mock fetch response that takes some time
    let resolveFetch: (value: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Log in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Check for loading state immediately after click
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /Logging in.../i })).toBeInTheDocument();
    });

    // Resolve the fetch promise to finish the submission
    // @ts-expect-error - We are intentionally resolving the promise here for testing
    resolveFetch({ ok: true, json: async () => ({}) });

    // Wait for the loading state to clear
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
    });
  });

  it("displays error message and calls toast on failed login (network error)", async () => {
    // Mock fetch to reject
    const error = new Error("Network error");
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Log in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    // Check if fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Check for error message display
    // The component catches the error and sets its own state
    expect(await screen.findByText(/Network error/i)).toBeVisible();

    // Check if toast.error was called
    expect(toast.error).toHaveBeenCalledWith("Network error");

    // Check that redirection did not happen
    expect(window.location.href).toBe("");

    // Check button is enabled again
    expect(submitButton).not.toBeDisabled();
  });

  it("displays error message and calls toast on failed login (API error)", async () => {
    // Mock fetch response with error
    const apiErrorMsg = "Invalid credentials";
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: apiErrorMsg }),
    });

    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Log in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    // Check if fetch was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Check for error message display
    expect(await screen.findByText(apiErrorMsg)).toBeVisible();

    // Check if toast.error was called
    expect(toast.error).toHaveBeenCalledWith(apiErrorMsg);

    // Check that redirection did not happen
    expect(window.location.href).toBe("");

    // Check button is enabled again
    expect(submitButton).not.toBeDisabled();
  });
});
