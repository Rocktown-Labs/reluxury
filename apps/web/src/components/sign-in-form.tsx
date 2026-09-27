import { Button } from "@reluxury/ui/components/button";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { mergeGuestCartIntoUserCart } from "@/functions/cart";
import { getUser } from "@/functions/get-user";
import { verifyTurnstile } from "@/functions/turnstile";
import { authClient } from "@/lib/auth-client";
import { clearGuestCart, getGuestCart } from "@/lib/guest-cart";
import { queryClient } from "@/lib/query-client";
import RequiredMark from "@/components/required-mark";

import GoogleIcon from "./google-icon";
import Loader from "./loader";
import TurnstileWidget from "./turnstile-widget";

export default function SignInForm({
  onSwitchToSignUp,
  redirectTo,
}: {
  onSwitchToSignUp: () => void;
  redirectTo?: string;
}) {
  const navigate = useNavigate({
    from: "/",
  });
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const resetCaptcha = () => {
    setTurnstileToken(null);
    setCaptchaKey((key) => key + 1);
  };

  const navigateByRole = async () => {
    await syncPostAuthState();
    if (redirectTo) {
      await navigate({ to: redirectTo });
      return;
    }
    const session = await getUser();
    if (session?.user.role === "admin") {
      await navigate({ to: "/admin" });
    } else {
      await navigate({ to: "/dashboard" });
    }
  };

  const syncPostAuthState = async () => {
    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      await mergeGuestCartIntoUserCart({ data: { items: guestCart } });
      clearGuestCart();
    }

    await queryClient.invalidateQueries({ queryKey: ["session"] });
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
    await queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    await router.invalidate({ sync: true });
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Enter your email address first");
      return;
    }
    setResetSending(true);
    const { error } = await authClient.requestPasswordReset({
      email: resetEmail,
      redirectTo: "/reset-password",
    });
    setResetSending(false);
    if (error) {
      toast.error(error.message || "Could not send reset email");
      return;
    }
    toast.success("If that email exists, a reset link is on its way");
    setShowForgotPassword(false);
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social(
      { callbackURL: redirectTo ?? "/dashboard", provider: "google" },
      {
        onError: (error) => {
          toast.error(error.error.message || "Google sign-in unavailable");
        },
        onSuccess: async () => {
          await navigateByRole();
        },
      }
    );
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const verification = await verifyTurnstile({
        data: { action: "login", token: turnstileToken ?? "" },
      });
      if (!verification.success) {
        toast.error("Verification failed — please try again");
        resetCaptcha();
        return;
      }
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
            resetCaptcha();
          },
          onSuccess: async () => {
            await navigateByRole();
            toast.success("Sign in successful");
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

      <Button
        type="button"
        variant="outline"
        className="w-full mb-4 gap-2"
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Email
                  <RequiredMark />
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Password
                  <RequiredMark />
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <>
              <TurnstileWidget
                action="login"
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                onToken={setTurnstileToken}
                resetKey={captchaKey}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Sign In"}
              </Button>
            </>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center space-y-1">
        <Button
          variant="link"
          onClick={() => setShowForgotPassword(!showForgotPassword)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Forgot password?
        </Button>
        <div>
          <Button
            variant="link"
            onClick={onSwitchToSignUp}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Need an account? Sign Up
          </Button>
        </div>
      </div>

      {showForgotPassword && (
        <div className="mt-4 space-y-3 rounded-lg border border-gold/10 p-4">
          <Label htmlFor="reset-email">
            Email for reset link
            <RequiredMark />
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resetSending}
            onClick={handleForgotPassword}
          >
            {resetSending ? "Sending..." : "Send reset link"}
          </Button>
        </div>
      )}
    </div>
  );
}
