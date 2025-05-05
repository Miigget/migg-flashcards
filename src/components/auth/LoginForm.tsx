import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Import toast for displaying errors

// Define Zod schema for validation
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Infer the type from the schema
type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for general form error

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit", // Validate on submit
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed. Please try again.");
      }

      // On success, redirect to the home page (which redirects to /generate)
      window.location.href = "/";
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage); // Set general error state
      toast.error(errorMessage); // Display error using toast
      // eslint-disable-next-line no-console
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Original handle submit is replaced by react-hook-form's handleSubmit(onSubmit)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your email below to login to your account.</CardDescription>
      </CardHeader>
      {/* Add noValidate and use react-hook-form's handleSubmit */}
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-2">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            {/* Register email input */}
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register("email")} // Register with react-hook-form
              aria-invalid={errors.email ? "true" : "false"} // Accessibility
            />
            {/* Display email error message */}
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            {/* Register password input */}
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")} // Register with react-hook-form
              aria-invalid={errors.password ? "true" : "false"} // Accessibility
            />
            {/* Display password error message */}
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          {/* Display general form error */}
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {/* Button type is submit, handled by react-hook-form */}
          <Button type="submit" className="w-full mt-6" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
          <div className="mt-4 text-center text-sm w-full">
            <a href="/auth/forgot-password" className="underline">
              Forgot your password?
            </a>
            <p className="mt-2">
              Don&apos;t have an account?{" "}
              <a href="/auth/register" className="underline">
                Register
              </a>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
