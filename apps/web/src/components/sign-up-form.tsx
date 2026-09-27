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

export default function SignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: {
  onSwitchToSignIn: () => void;
  redirectTo?: string;
}) {
  const navigate = useNavigate({
    from: "/",
  });
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const resetCaptcha = () => {
    setTurnstileToken(null);
    setCaptchaKey((key) => key + 1);
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

  const handleGoogleSignUp = async () => {
    await authClient.signIn.social(
      { callbackURL: redirectTo ?? "/dashboard", provider: "google" },
      {
        onError: (error) => {
          toast.error(error.error.message || "Google sign-up unavailable");
        },
        onSuccess: async () => {
          await syncPostAuthState();
          if (redirectTo) {
            await navigate({ to: redirectTo });
          } else {
            await navigate({ to: "/dashboard" });
          }
        },
      }
    );
  };

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const verification = await verifyTurnstile({
        data: { action: "signup", token: turnstileToken ?? "" },
      });
      if (!verification.success) {
        toast.error("Verification failed — please try again");
        resetCaptcha();
        return;
      }
      await authClient.signUp.email(
        {
          email: value.email,
          name: value.name,
          password: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
            resetCaptcha();
          },
          onSuccess: async () => {
            await syncPostAuthState();
            if (redirectTo) {
              await navigate({ to: redirectTo });
              toast.success("Sign up successful");
              return;
            }
            const session = await getUser();
            if (session?.user.role === "admin") {
              await navigate({ to: "/admin" });
            } else {
              await navigate({ to: "/dashboard" });
            }
            toast.success("Sign up successful");
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Create Account</h1>

      <Button
        type="button"
        variant="outline"
        className="w-full mb-4 gap-2"
        onClick={handleGoogleSignUp}
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
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Name
                  <RequiredMark />
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
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
                action="signup"
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
                {isSubmitting ? "Submitting..." : "Sign Up"}
              </Button>
            </>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Already have an account? Sign In
        </Button>
      </div>
    </div>
  );
}
