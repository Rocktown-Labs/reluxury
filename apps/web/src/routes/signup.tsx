import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import SignUpForm from "@/components/sign-up-form";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
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
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();
  const redirectTo = getSafeRedirect(redirect);

  return (
    <div>
      <SignUpForm
        onSwitchToSignIn={() =>
          navigate({
            search: redirectTo ? { redirect: redirectTo } : {},
            to: "/login",
          })
        }
        redirectTo={redirectTo}
      />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="text-gold hover:underline"
          search={redirectTo ? { redirect: redirectTo } : {}}
          to="/login"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
