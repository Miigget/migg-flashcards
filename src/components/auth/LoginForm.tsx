import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define Zod schema for validation
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Infer the type from the schema
type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit", // Validate on submit
  });

  // TODO: Replace console.log with actual API call
  const onSubmit = (data: LoginFormInputs) => {
    console.log("Form data:", data);
    // TODO: Implement fetch call to /api/auth/login
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
              placeholder="m@example.com"
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
              {...register("password")} // Register with react-hook-form
              aria-invalid={errors.password ? "true" : "false"} // Accessibility
            />
            {/* Display password error message */}
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          {/* Button type is submit, handled by react-hook-form */}
          <Button type="submit" className="w-full mt-6">
            Log in
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
