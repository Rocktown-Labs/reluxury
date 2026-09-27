import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  beforeLoad: ({ search }) => {
    if (search.mode === "signup") {
      throw redirect({
        search: search.redirect ? { redirect: search.redirect } : {},
        to: "/signup",
      });
    }
  },
  component: RouteComponent,
  validateSearch: searchSchema,
});

function getSafeRedirect(redirectParam: string | undefined): string | undefined {
  if (
    !redirectParam ||
    !redirectParam.startsWith("/") ||
    redirectParam.startsWith("//")
  ) {
    return undefined;
  }
  return redirectParam;
}

function RouteComponent() {
  const { redirect: redirectParam } = Route.useSearch();
  const [showSignIn, setShowSignIn] = useState(true);
  const redirectTo = getSafeRedirect(redirectParam);

  return showSignIn ? (
    <SignInForm
      onSwitchToSignUp={() => setShowSignIn(false)}
      redirectTo={redirectTo}
    />
  ) : (
    <div>
      <SignUpForm
        onSwitchToSignIn={() => setShowSignIn(true)}
        redirectTo={redirectTo}
      />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Prefer a dedicated page?{" "}
        <Link
          className="text-gold hover:underline"
          search={redirectTo ? { redirect: redirectTo } : {}}
          to="/signup"
        >
          Go to sign up
        </Link>
      </p>
    </div>
  );
}
