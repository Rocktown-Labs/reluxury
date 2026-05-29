import { Button } from "@reluxury/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@reluxury/ui/components/dropdown-menu";
import { Skeleton } from "@reluxury/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  User,
  Package,
  Scissors,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";

import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isLoading } = useQuery({
    queryFn: () => getUser(),
    queryKey: ["session"],
  });

  if (isLoading) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link to="/login">
        <Button
          variant="outline"
          className="border-gold/20 text-gold hover:bg-gold/10"
        >
          Sign In
        </Button>
      </Link>
    );
  }

  const isAdmin = session.user.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="border-gold/20 gap-2" />}
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-gold/10 w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-gold">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gold/10" />

          <Link to="/dashboard" search={{ tab: "orders" }}>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Package className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
          </Link>

          <Link to="/dashboard" search={{ tab: "bookings" }}>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Scissors className="h-4 w-4" />
              My Alterations
            </DropdownMenuItem>
          </Link>

          <Link to="/dashboard" search={{ tab: "events" }}>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <Calendar className="h-4 w-4" />
              My Workshops
            </DropdownMenuItem>
          </Link>

          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-gold/10" />
              <Link to="/admin">
                <DropdownMenuItem className="cursor-pointer gap-2 text-gold">
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </DropdownMenuItem>
              </Link>
            </>
          )}

          <DropdownMenuSeparator className="bg-gold/10" />
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer gap-2"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    queryClient.setQueryData(["session"], null);
                    queryClient.invalidateQueries({
                      queryKey: ["session"],
                    });
                    navigate({ to: "/" });
                  },
                },
              });
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
