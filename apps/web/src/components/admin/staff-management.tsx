import {
  ROLE_PRESETS,
  STAFF_PERMISSIONS,
  STAFF_ROLES,
  getPermissionsForRole,
} from "@reluxury/auth/permissions";
import type { StaffPermission, StaffRole } from "@reluxury/auth/permissions";
/* oxlint-disable no-use-before-define, func-style, typescript/no-explicit-any, complexity */
import { Badge } from "@reluxury/ui/components/badge";
import { Button } from "@reluxury/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@reluxury/ui/components/dialog";
import { Input } from "@reluxury/ui/components/input";
import { Label } from "@reluxury/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reluxury/ui/components/table";
import { useState } from "react";
import { toast } from "sonner";

import {
  adminInviteStaff,
  adminUpdateStaff,
  adminRemoveStaff,
  adminResendInvite,
  adminRevokeInvite,
  adminSetUserBanned,
} from "@/functions/staff";
import { adminKeys } from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

function invalidateStaff() {
  return queryClient.invalidateQueries({ queryKey: adminKeys.staff() });
}

export default function StaffManagement({
  auditLog,
  canViewAudit,
  invitations,
  members,
}: {
  auditLog: any[] | undefined;
  canViewAudit: boolean;
  invitations: any[];
  members: any[];
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("tailor");
  const [invitePermissions, setInvitePermissions] = useState<StaffPermission[]>(
    getPermissionsForRole("tailor")
  );
  const [isInviting, setIsInviting] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<StaffRole>("custom");
  const [editPermissions, setEditPermissions] = useState<StaffPermission[]>([]);
  const [editActive, setEditActive] = useState(true);
  const [editBanned, setEditBanned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRoleChange = (role: StaffRole) => {
    setInviteRole(role);
    setInvitePermissions(getPermissionsForRole(role));
  };

  const toggleInvitePermission = (permission: StaffPermission) => {
    setInvitePermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setIsInviting(true);
    try {
      await adminInviteStaff({
        data: {
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          permissions: invitePermissions,
          role: inviteRole,
        },
      });
      toast.success("Invitation sent");
      setIsInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("tailor");
      setInvitePermissions(getPermissionsForRole("tailor"));
      await invalidateStaff();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invite failed");
    } finally {
      setIsInviting(false);
    }
  };

  const openEditor = (member: any) => {
    setEditingMember(member);
    setEditRole(member.role as StaffRole);
    try {
      const parsed: unknown = JSON.parse(member.permissions ?? "[]");
      setEditPermissions(
        Array.isArray(parsed)
          ? parsed.filter((entry): entry is StaffPermission =>
              STAFF_PERMISSIONS.includes(entry as StaffPermission)
            )
          : []
      );
    } catch {
      setEditPermissions([]);
    }
    setEditActive(member.isActive);
    setEditBanned(Boolean(member.user?.banned));
  };

  const toggleEditPermission = (permission: StaffPermission) => {
    setEditPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const handleSaveMember = async () => {
    if (!editingMember) {
      return;
    }
    setIsSaving(true);
    try {
      await adminUpdateStaff({
        data: {
          id: editingMember.id,
          isActive: editActive,
          permissions: editPermissions,
          role: editRole,
        },
      });
      if (editingMember.user?.email) {
        await adminSetUserBanned({
          data: {
            banned: editBanned,
            email: editingMember.user.email,
          },
        });
      }
      toast.success("Team member updated");
      setEditingMember(null);
      await invalidateStaff();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (member: any) => {
    if (
      // oxlint-disable-next-line no-alert
      !confirm(
        `Remove ${member.user?.name ?? member.user?.email ?? "this member"} from the team? They will lose admin access immediately.`
      )
    ) {
      return;
    }
    try {
      await adminRemoveStaff({ data: member.id });
      toast.success("Team member removed");
      await invalidateStaff();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed");
    }
  };

  const handleResend = async (id: string) => {
    try {
      await adminResendInvite({ data: id });
      toast.success("Invitation resent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resend failed");
    }
  };

  const handleRevoke = async (id: string) => {
    if (
      // oxlint-disable-next-line no-alert
      !confirm("Revoke this invitation?")
    ) {
      return;
    }
    try {
      await adminRevokeInvite({ data: id });
      toast.success("Invitation revoked");
      await invalidateStaff();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Revoke failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-gold/10">
        <h2 className="font-display text-xl text-foreground">Team</h2>
        <Button
          size="sm"
          className="bg-gold text-primary-foreground hover:bg-gold-dark gap-2"
          onClick={() => setIsInviteOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      <div className="rounded-xl border border-gold/10 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Member</TableHead>
              <TableHead className="text-gold">Role</TableHead>
              <TableHead className="text-gold">Status</TableHead>
              <TableHead className="text-gold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow
                key={member.id}
                className="border-gold/10 hover:bg-gold/5"
              >
                <TableCell>
                  <p className="text-sm font-medium">
                    {member.user?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user?.email ?? ""}
                    {member.title ? ` · ${member.title}` : ""}
                    {member.alias ? ` · @${member.alias}` : ""}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize border-gold/20 text-gold"
                  >
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${member.isActive ? "text-green-500 border-green-500/20" : "text-muted-foreground"}`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold/20 text-gold hover:bg-gold/10 text-xs"
                    onClick={() => openEditor(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive text-xs"
                    onClick={() => handleRemove(member)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  No team members yet. Send the first invite.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {invitations.some((invite) => invite.status === "pending") && (
        <div className="rounded-xl border border-gold/10 bg-card p-6 space-y-4">
          <h3 className="font-display text-lg text-foreground">
            Pending Invitations
          </h3>
          <ul className="space-y-3">
            {invitations
              .filter((invite) => invite.status === "pending")
              .map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {invite.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({invite.email})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {invite.role} · expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gold/20 text-gold hover:bg-gold/10 text-xs"
                      onClick={() => handleResend(invite.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive text-xs"
                      onClick={() => handleRevoke(invite.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {canViewAudit && auditLog && (
        <div className="rounded-xl border border-gold/10 bg-card p-6 space-y-4">
          <h3 className="font-display text-lg text-foreground">
            Recent Activity
          </h3>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audited actions yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {auditLog.slice(0, 30).map((entry: any) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 text-xs border-b border-gold/5 pb-2"
                >
                  <div>
                    <span className="font-mono text-gold">{entry.action}</span>{" "}
                    <span className="text-muted-foreground">
                      {entry.entityType}
                      {entry.entityId ? ` ${entry.entityId.slice(0, 8)}` : ""}
                    </span>
                    <p className="text-muted-foreground/70">
                      by {entry.actor?.name ?? entry.actor?.email ?? "system"}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-lg bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Invite Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="border-gold/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="border-gold/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
              >
                {STAFF_ROLES.filter((role) => role !== "owner").map((role) => (
                  <option key={role} value={role}>
                    {role} — {ROLE_PRESETS[role].length} permissions
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {STAFF_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={invitePermissions.includes(permission)}
                      onChange={() => toggleInvitePermission(permission)}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              disabled={isInviting}
              onClick={handleInvite}
            >
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingMember !== null}
        onOpenChange={() => setEditingMember(null)}
      >
        <DialogContent className="max-w-lg bg-card border border-gold/25 p-6">
          <DialogHeader>
            <DialogTitle className="text-gold font-display font-light text-2xl">
              Edit {editingMember?.user?.name ?? "Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={editRole}
                onChange={(e) => {
                  const role = e.target.value as StaffRole;
                  setEditRole(role);
                  setEditPermissions(getPermissionsForRole(role));
                }}
                className="flex h-10 w-full rounded-md border border-gold/10 bg-background px-3 py-2 text-sm text-foreground"
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {STAFF_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={editPermissions.includes(permission)}
                      onChange={() => toggleEditPermission(permission)}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="staff-active"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              <Label htmlFor="staff-active">Active (can access admin)</Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="staff-banned"
                checked={editBanned}
                onChange={(e) => setEditBanned(e.target.checked)}
              />
              <Label htmlFor="staff-banned">Login disabled (ban account)</Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              className="bg-gold text-primary-foreground hover:bg-gold-dark"
              disabled={isSaving}
              onClick={handleSaveMember}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
