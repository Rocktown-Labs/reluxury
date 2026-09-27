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
import { authClient } from "@/lib/auth-client";
import { clearGuestCart, getGuestCart } from "@/lib/guest-cart";
import { queryClient } from "@/lib/query-client";
import RequiredMark from "@/components/required-mark";

import Loader from "./loader";

function GoogleIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.66.37 3.23 1.02 4.64l4.82-2.54z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

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
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
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
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Sign In"}
            </Button>
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
