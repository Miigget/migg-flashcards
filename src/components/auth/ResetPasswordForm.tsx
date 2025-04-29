import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define Zod schema for reset password validation
const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    confirmNewPassword: z.string().min(1, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"], // Error applies to the confirmNewPassword field
  });

// Infer the type from the schema
type ResetPasswordFormInputs = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
  });

  // TODO: Replace console.log with actual API call
  const onSubmit = (data: ResetPasswordFormInputs) => {
    console.log("Reset Password Form data:", data);
    // TODO: Implement fetch call to /api/auth/reset-password, passing the token
    // TODO: Redirect to /auth/login on success
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              {...register("newPassword")}
              aria-invalid={errors.newPassword ? "true" : "false"}
            />
            {errors.newPassword && <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              {...register("confirmNewPassword")}
              aria-invalid={errors.confirmNewPassword ? "true" : "false"}
            />
            {errors.confirmNewPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmNewPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full mt-4">
            Change Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
