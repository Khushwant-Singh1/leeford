"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

const OTPSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, { message: "OTP must be 6 digits." }),
});

export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const isResent = searchParams.get("resent") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // --- Countdown Timer Logic ---
  useEffect(() => {
    if (canResend) return;

    if (countdown === 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, canResend]);

  // Show resent message
  useEffect(() => {
    if (isResent) {
      setSuccessMessage("A new OTP has been sent to your email for verification.");
    }
  }, [isResent]);

  const form = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { otp: "" },
  });

  // --- Form Submission Handler ---
  async function onSubmit(values: z.infer<typeof OTPSchema>) {
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: values.otp }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error || "OTP verification failed";
        
        // Check if we should show the resend button (max attempts exceeded)
        if (data.showResendButton) {
          setCanResend(true);
        }
        
        throw new Error(errorMessage);
      }

      // Show success message
      setSuccessMessage(
        "Verification successful! Redirecting to login..."
      );

      // Redirect to login page with verification success indicator
      setTimeout(() => {
        router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      form.reset(); // Clear input on error
    } finally {
      setIsLoading(false);
    }
  }

  // --- Resend OTP Handler ---
  async function handleResendOtp() {
    if (!email || !canResend) return;

    setCanResend(false);
    setError(null);
    setSuccessMessage(null);

    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSuccessMessage("A new OTP has been sent to your email.");
      setCountdown(60); // Reset timer
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
      setCanResend(true); // Allow user to try again if it fails
    }
  }

  if (!email) {
    // Handle case where email is missing from URL
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>
            No email address was provided. Please return to the registration
            page and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/register")} className="w-full">
            Go to Registration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <br />
          <strong className="text-foreground">{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert variant="default">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">One-Time Password</FormLabel>
                    <FormControl>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          {...field}
                          onComplete={form.handleSubmit(onSubmit)} // Auto-submit on completion
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {canResend ? (
            <>
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOtp}
                className="font-medium underline hover:text-primary"
              >
                Resend
              </button>
            </>
          ) : (
            <p className="text-muted-foreground">Resend code in {countdown}s</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
