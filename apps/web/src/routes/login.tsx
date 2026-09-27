import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function getSafeRedirect(redirect: string | undefined): string | undefined {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return undefined;
  }
  return redirect;
}

function RouteComponent() {
  const { mode, redirect } = Route.useSearch();
  const [showSignIn, setShowSignIn] = useState(mode !== "signup");
  const redirectTo = getSafeRedirect(redirect);

  return showSignIn ? (
    <SignInForm
      onSwitchToSignUp={() => setShowSignIn(false)}
      redirectTo={redirectTo}
    />
  ) : (
    <SignUpForm
      onSwitchToSignIn={() => setShowSignIn(true)}
      redirectTo={redirectTo}
    />
  );
}
