"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/app/providers/UserProvider";
import { useParams } from "next/navigation";
import { UserDB } from "@/db/schema";
import HeaderCard from "@/components/dashboard-header-card";
type UserRow = {
  id: string | number;
  mail: string;
  username: string;
  row: string;
  date: string;
};

export default function ManageUserPage() {
  const params = useParams();
  const teamId = (params as unknown as { teamId?: string })?.teamId;
  const pageSize = 8;
  const [datas, setDatas] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [selectedUsers, setSelectedUsers] = React.useState<
    Set<string | number>
  >(new Set());
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  // When adding a user to a team we present a dropdown of existing users
  // that are not currently members of the team.
  const [availableUsers, setAvailableUsers] = React.useState<
    Array<{ id: string; email: string; fullName?: string; role?: string }>
  >([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    null
  );
  const [loadingAvailable, setLoadingAvailable] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // get current access token from provider to authenticate API calls
  const { accessToken } = useUser();

  // fetch available users (not in team) when dialog opens
  React.useEffect(() => {
    if (!showAddDialog || !accessToken || !teamId) return;
    let mounted = true;
    (async () => {
      setLoadingAvailable(true);
      try {
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Failed to fetch users for add dropdown", json);
          return;
        }

        const users = (json.users ?? []) as Array<UserDB>;
        const memberIds = new Set(datas.map((d) => String(d.id)));
        const notMembers = users
          .filter((u) => !memberIds.has(String(u.id)))
          .map((u) => ({
            id: String(u.id),
            email: u.email ?? "",
            fullName: u.fullName ?? "",
            role: u.role,
          }))
          .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

        if (mounted) {
          setAvailableUsers(notMembers);
          setSelectedUserId(notMembers.length > 0 ? notMembers[0].id : null);
        }
      } catch (err) {
        console.error("Error fetching available users", err);
      } finally {
        if (mounted) setLoadingAvailable(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showAddDialog, accessToken, teamId, datas]);

  // fetch team members on mount (and when accessToken or teamId changes)
  React.useEffect(() => {
    if (!accessToken || !teamId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch all users, then filter by membership in the team using the teams/members API
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("Failed to fetch users", json);
          if (mounted) setError(json.error || "Failed to fetch users");
          return;
        }

        const users = json.users ?? [];

        const members = await Promise.all(
          users.map(async (u: UserDB) => {
            try {
              const r = await fetch(`/api/admin/teams/members?userId=${u.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const jr = await r.json().catch(() => ({}));
              if (!r.ok) return null;
              const teamsForUser = jr.teamId ?? [];
              const isMember =
                Array.isArray(teamsForUser) &&
                teamsForUser.some((t: UserDB) => String(t.id) === String(teamId));
              if (isMember) {
                return {
                  id: u.id,
                  mail: u.email ?? "",
                  username: u.fullName ?? "",
                  row: u.role ?? "",
                  date: u.createdAt
                    ? new Date(u.createdAt).toISOString().split("T")[0]
                    : "",
                } as UserRow;
              }
            } catch (err) {
              console.error("Error checking membership for user", u.id, err);
              return null;
            }
            return null;
          })
        );

        const filtered = members.filter(Boolean) as UserRow[];
        if (mounted) setDatas(filtered);
      } catch (err) {
        console.error("Error fetching users", err);
        if (mounted) setError("Error fetching users");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [accessToken, teamId]);

  const totalItems = datas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Filter data based on search query
  const filteredData = datas.filter(
    (user) =>
      user.mail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.row.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTotalItems = filteredData.length;
  const filteredTotalPages = Math.max(
    1,
    Math.ceil(filteredTotalItems / pageSize)
  );

  React.useEffect(() => {
    if (page > filteredTotalPages) setPage(filteredTotalPages);
  }, [page, filteredTotalPages]);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const start = (page - 1) * pageSize;
  const currentRows = filteredData.slice(start, start + pageSize);
  const goTo = (p: number) =>
    setPage(Math.min(filteredTotalPages, Math.max(1, p)));
  const pages = Array.from({ length: filteredTotalPages }, (_, i) => i + 1);

  const handleSelectUser = (userId: string | number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === currentRows.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(currentRows.map((u) => u.id)));
    }
  };

  const handleAddUser = async () => {
    if (!accessToken) return alert("You must be signed in to add a user");
    if (!teamId) return alert("No team selected");
    if (!selectedUserId) return alert("Select a user to add");

    try {
      const res = await fetch("/api/admin/teams/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ teamId: teamId, memberId: selectedUserId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to add user to team", json);
        alert(json.error || "Failed to add user to team");
        return;
      }

      // find the user in availableUsers and add to local datas
      const user = availableUsers.find((u) => u.id === selectedUserId);
      if (user) {
        const mapped: UserRow = {
          id: user.id,
          mail: user.email,
          username: user.fullName ?? "",
          row: user.role ?? "",
          date: new Date().toISOString().split("T")[0],
        };
        setDatas((prev) => [...prev, mapped]);
      }

      // refresh available list
      setAvailableUsers((prev) => prev.filter((u) => u.id !== selectedUserId));
      setSelectedUserId(null);
      setShowAddDialog(false);
    } catch (err) {
      console.error("Error adding user to team", err);
      alert("Failed to add user to team");
    }
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.size === 0) return;
    if (!accessToken) {
      alert("You must be signed in to remove users from a team");
      return;
    }
    if (!teamId) {
      alert("No team selected");
      return;
    }

    const idsToDelete = Array.from(selectedUsers);
    (async () => {
      try {
        for (const id of idsToDelete) {
          const res = await fetch("/api/admin/teams/members", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ teamId: teamId, memberId: id }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            console.error("Failed to remove user from team", id, json);
            // continue removing other users
          }
        }

        // update local state after attempted removals
        setDatas((prev) => prev.filter((u) => !selectedUsers.has(u.id)));
        setSelectedUsers(new Set());
        setShowDeleteDialog(false);
      } catch (err) {
        console.error("Error removing users from team", err);
        alert("Failed to remove users from team");
      }
    })();
  };

  return (
    <div>
       <HeaderCard
          title="Manage Team Members"
          description="Manage your team members here."
      />

      <div className="mb-4 flex justify-end gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by email, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          className="group flex items-center gap-2 text-foreground"
          onClick={() => setShowAddDialog(true)}
        >
          <svg
            className="h-4 w-4 group-hover:text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <span>Add User</span>
        </Button>

        <Button
          variant="outline"
          className="group flex items-center gap-2 text-foreground"
          onClick={() => setShowDeleteDialog(true)}
          disabled={selectedUsers.size === 0}
        >
          <svg
            className="h-4 w-4 group-hover:text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>Delete User</span>
        </Button>
      </div>

      <div className="mb-8">
        {loading ? (
          <div className="p-4 text-center">Loading users…</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <table className="w-full border rounded-lg">
            <thead className="border-b">
              <tr>
                <th className="w-[50px] p-4 text-left">
                  <Checkbox
                    checked={
                      selectedUsers.size === currentRows.length &&
                      currentRows.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="w-[400px] p-4 text-left font-medium">E-mail</th>
                <th className="w-[300px] p-4 text-left font-medium">
                  User name
                </th>
                <th className="p-4 text-left font-medium">Role</th>
                <th className="p-4 text-right font-medium">Date added</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((u: UserRow) => (
                <tr key={u.id} className="border-b">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedUsers.has(u.id)}
                      onCheckedChange={() => handleSelectUser(u.id)}
                    />
                  </td>
                  <td className="p-4 font-medium">{u.mail}</td>
                  <td className="p-4">{u.username}</td>
                  <td className="p-4">{u.row}</td>
                  <td className="p-4 text-right">{u.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-3 text-sm text-muted-foreground">
          Showing {start + 1}-{Math.min(start + pageSize, filteredTotalItems)}{" "}
          of {filteredTotalItems}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => goTo(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={page === filteredTotalPages}
        >
          Next
        </Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Select an existing user to add to this team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-user-select">Choose user</Label>
              <Select
                value={selectedUserId ?? ""}
                onValueChange={(val) => setSelectedUserId(val || null)}
              >
                <SelectTrigger id="add-user-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loadingAvailable ? (
                    <SelectItem value="__loading" disabled>
                      Loading…
                    </SelectItem>
                  ) : availableUsers.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No available users
                    </SelectItem>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.email} {u.fullName ? ` — ${u.fullName}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Users</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUsers.size} user(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUsers}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
