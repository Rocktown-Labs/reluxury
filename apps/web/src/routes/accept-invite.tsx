import { Button } from "@reluxury/ui/components/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { acceptStaffInvite } from "@/functions/staff";
import { authClient } from "@/lib/auth-client";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/accept-invite")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const { data: session, isPending } = authClient.useSession();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    if (token) {
      setIsAccepting(true);
      try {
        await acceptStaffInvite({ data: token });
        toast.success("Welcome to the team");
        await navigate({ to: "/admin" });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not accept invitation"
        );
      } finally {
        setIsAccepting(false);
      }
    } else {
      toast.error("This invitation link is missing its token");
    }
  };

  if (isPending) {
    return (
      <div className="mx-auto w-full mt-10 max-w-md p-6 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto w-full mt-10 max-w-md p-6 text-center space-y-4">
        <h1 className="text-3xl font-bold">Team Invitation</h1>
        <p className="text-sm text-muted-foreground">
          Sign in (or create your account) with your invited email address
          first, then reopen this invitation link.
        </p>
        <Link to="/login">
          <Button className="w-full">Go to Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6 text-center space-y-4">
      <h1 className="text-3xl font-bold">Team Invitation</h1>
      {token ? (
        <>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.email}. Accept to join the ReLUXURY team.
          </p>
          <Button
            className="w-full"
            disabled={isAccepting}
            onClick={handleAccept}
          >
            {isAccepting ? "Joining..." : "Accept Invitation"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-red-500">
          This invitation link is invalid or expired.
        </p>
      )}
    </div>
  );
}
