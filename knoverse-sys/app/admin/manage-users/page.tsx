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
import HeaderCard from "@/components/dashboard-header-card"

type UserRow = {
  id: string | number;
  mail: string;
  username: string;
  row: string;
  date: string;
};

const initialData: UserRow[] = [
  {
    id: 1,
    mail: "john.doe@example.com",
    username: "John Doe",
    row: "Admin",
    date: "2024-01-15",
  },
  {
    id: 2,
    mail: "jane.smith@example.com",
    username: "Jane Smith",
    row: "User",
    date: "2024-02-20",
  },
  {
    id: 4,
    mail: "alice.jones@example.com",
    username: "Alice Jones",
    row: "User",
    date: "2024-04-05",
  },
  {
    id: 5,
    mail: "charlie.brown@example.com",
    username: "Charlie Brown",
    row: "Admin",
    date: "2024-05-12",
  },
  {
    id: 7,
    mail: "emma.davis@example.com",
    username: "Emma Davis",
    row: "User",
    date: "2024-07-22",
  },
  {
    id: 8,
    mail: "frank.miller@example.com",
    username: "Frank Miller",
    row: "User",
    date: "2024-08-30",
  },
  {
    id: 10,
    mail: "henry.white@example.com",
    username: "Henry White",
    row: "Admin",
    date: "2024-10-25",
  },
];

export default function ManageUserPage() {
  const pageSize = 8;
  const [datas, setDatas] = React.useState<UserRow[]>(initialData as UserRow[]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [selectedUsers, setSelectedUsers] = React.useState<
    Set<string | number>
  >(new Set());
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    mail: "",
    username: "",
    row: "User",
  });
  const [createdCredentials, setCreatedCredentials] = React.useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // get current access token from provider to authenticate API calls
  const { accessToken } = useUser();

  // fetch real users on mount (and when accessToken changes)
  React.useEffect(() => {
    if (!accessToken) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (!res.ok) {
          console.error("Failed to fetch users", json);
          if (mounted) setError(json.error || "Failed to fetch users");
        } else {
          const users = json.users ?? [];
          if (mounted)
            setDatas(
              users.map(
                (
                  u: {
                    id?: string | number;
                    email?: string;
                    fullName?: string;
                    role?: string;
                    createdAt?: string | number;
                  },
                  i: number
                ) => ({
                  id: u.id ?? i + 1,
                  mail: u.email ?? "",
                  username: u.fullName ?? "",
                  row: u.role ?? "",
                  date: u.createdAt
                    ? new Date(u.createdAt).toISOString().split("T")[0]
                    : "",
                })
              )
            );
        }
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
  }, [accessToken]);

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
    if (!newUser.mail || !newUser.username) {
      alert("Please fill in all required fields");
      return;
    }
    if (!accessToken) {
      alert("You must be signed in to add a user");
      return;
    }

    // map UI role to API role values
    const roleMap: Record<string, string> = {
      Admin: "admin",
      Member: "member",
    };
    const userRole = roleMap[newUser.row] ?? "member";

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: newUser.mail,
          userName: newUser.username,
          userRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Add user failed", json);
        alert(json.error || "Failed to add user");
        return;
      }

      // API returns user, email and password; update local list with authoritative user
      const returnedPassword = json.password ?? "";
      setCreatedCredentials({
        email: json.email ?? newUser.mail,
        password: returnedPassword,
      });

      const serverUser = json.user ?? null;
      if (serverUser) {
        const mapped = {
          id: serverUser.id,
          mail: serverUser.email ?? newUser.mail,
          username: serverUser.fullName ?? newUser.username,
          row: serverUser.role ?? newUser.row,
          date: serverUser.createdAt
            ? new Date(serverUser.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        };
        setDatas((prev) => [...prev, mapped]);
      } else {
        // fallback to optimistic insert
        const newId =
          Math.max(
            ...datas.map((d) => (typeof d.id === "number" ? d.id : 0)),
            0
          ) + 1;
        const today = new Date().toISOString().split("T")[0];
        setDatas([
          ...datas,
          {
            id: newId,
            mail: newUser.mail,
            username: newUser.username,
            row: newUser.row,
            date: today,
          },
        ]);
      }

      setNewUser({ mail: "", username: "", row: "Member" });
      setShowAddDialog(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error adding user", err);
      alert("Failed to add user");
    }
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.size === 0) return;
    if (!accessToken) {
      alert("You must be signed in to delete users");
      return;
    }

    const idsToDelete = Array.from(selectedUsers);
    (async () => {
      try {
        for (const id of idsToDelete) {
          const res = await fetch("/api/admin/users", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ userId: id }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            console.error("Failed to delete user", id, json);
            // continue deleting other users
          }
        }

        // update local state after attempted deletions
        setDatas(datas.filter((u) => !selectedUsers.has(u.id)));
        setSelectedUsers(new Set());
        setShowDeleteDialog(false);
      } catch (err) {
        console.error("Error deleting users", err);
        alert("Failed to delete users");
      }
    })();
  };

  return (
    <div>
      <HeaderCard 
      title="Manage Users"
      description="Manage your team members and their account permissions here."
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
              Enter the details of the new user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.mail}
                onChange={(e) =>
                  setNewUser({ ...newUser, mail: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="John Doe"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.row}
                onValueChange={(val) => setNewUser({ ...newUser, row: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Added Successfully</DialogTitle>
            <DialogDescription>
              The new user was created. Copy the credentials below and share
              with the user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={createdCredentials?.email ?? ""} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input value={createdCredentials?.password ?? ""} readOnly />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </Button>
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
