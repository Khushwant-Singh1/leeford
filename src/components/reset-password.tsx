"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "./password-input";

// Zod schema for form validation
const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<
    "form" | "success" | "invalid_token"
  >("form");

  // Validate token presence on component mount
  useEffect(() => {
    if (!token) {
      setFormState("invalid_token");
      toast.error("Invalid Link", {
        description: "The password reset link is missing a token.",
      });
    }
  }, [token]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      toast.success("Password Reset Successfully!");
      setFormState("success");
    } catch (err: any) {
      toast.error("Operation Failed", {
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (formState === "invalid_token") {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <CardTitle className="text-2xl mt-4">Invalid Reset Link</CardTitle>
          <CardDescription>
            This link is either expired or invalid. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push("/forgot-password")}
            className="w-full"
          >
            Request New Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (formState === "success") {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl mt-4">Password Changed!</CardTitle>
          <CardDescription>
            Your password has been updated successfully. You can now log in with
            your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/login")} className="w-full">
            Return to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create a New Password</CardTitle>
        <CardDescription>
          This will be the new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                "Set New Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
