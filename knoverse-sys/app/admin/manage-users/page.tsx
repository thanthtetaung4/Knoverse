'use client'

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const initialData = [
  { id: 1, mail: 'john.doe@example.com', username: 'John Doe', row: 'Admin', date: '2024-01-15' },
  { id: 2, mail: 'jane.smith@example.com', username: 'Jane Smith', row: 'User', date: '2024-02-20' },
  { id: 4, mail: 'alice.jones@example.com', username: 'Alice Jones', row: 'User', date: '2024-04-05' },
  { id: 5, mail: 'charlie.brown@example.com', username: 'Charlie Brown', row: 'Admin', date: '2024-05-12' },
  { id: 7, mail: 'emma.davis@example.com', username: 'Emma Davis', row: 'User', date: '2024-07-22' },
  { id: 8, mail: 'frank.miller@example.com', username: 'Frank Miller', row: 'User', date: '2024-08-30' },
  { id: 10, mail: 'henry.white@example.com', username: 'Henry White', row: 'Admin', date: '2024-10-25' },
];

export default function ManageUserPage() {
  const pageSize = 8;
  const [datas, setDatas] = React.useState(initialData);
  const [page, setPage] = React.useState(1);
  const [selectedUsers, setSelectedUsers] = React.useState(new Set());
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ mail: '', username: '', row: 'User' });
  const [searchQuery, setSearchQuery] = React.useState('');

  const totalItems = datas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Filter data based on search query
  const filteredData = datas.filter(user =>
    user.mail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.row.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTotalItems = filteredData.length;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredTotalItems / pageSize));

  React.useEffect(() => {
    if (page > filteredTotalPages) setPage(filteredTotalPages);
  }, [page, filteredTotalPages]);

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const start = (page - 1) * pageSize;
  const currentRows = filteredData.slice(start, start + pageSize);
  const goTo = (p: number) => setPage(Math.min(filteredTotalPages, Math.max(1, p)));
  const pages = Array.from({ length: filteredTotalPages }, (_, i) => i + 1);

  const handleSelectUser = (userId: number) => {
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
      setSelectedUsers(new Set(currentRows.map(u => u.id)));
    }
  };

  const handleAddUser = () => {
    if (!newUser.mail || !newUser.username) {
      alert('Please fill in all required fields');
      return;
    }
    const newId = Math.max(...datas.map(d => d.id), 0) + 1;
    const today = new Date().toISOString().split('T')[0];
    setDatas([...datas, { id: newId, mail: newUser.mail, username: newUser.username, row: newUser.row, date: today }]);
    setNewUser({ mail: '', username: '', row: 'User' });
    setShowAddDialog(false);
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.size === 0) return;
    setDatas(datas.filter(u => !selectedUsers.has(u.id)));
    setSelectedUsers(new Set());
    setShowDeleteDialog(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-sans font-bold">Manage Users</h1>
        <p className='mt-2'>Manage your team members and their account permissions here.</p>
        <Separator className='my-4' />
      </div>

      <div className="mb-4 flex justify-end gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by email, name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button variant="outline" className="group flex items-center gap-2 text-foreground" onClick={() => setShowAddDialog(true)}>
          <svg className="h-4 w-4 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Add User</span>
        </Button>

        <Button variant="outline" className="group flex items-center gap-2 text-foreground" onClick={() => setShowDeleteDialog(true)} disabled={selectedUsers.size === 0}>
          <svg className="h-4 w-4 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete User</span>
        </Button>
      </div>

      <div className="mb-8">
        <table className="w-full border rounded-lg">
          <thead className="border-b">
            <tr>
              <th className="w-[50px] p-4 text-left">
                <Checkbox checked={selectedUsers.size === currentRows.length && currentRows.length > 0} onCheckedChange={handleSelectAll} />
              </th>
              <th className="w-[400px] p-4 text-left font-medium">E-mail</th>
              <th className="w-[300px] p-4 text-left font-medium">User name</th>
              <th className="p-4 text-left font-medium">Role</th>
              <th className="p-4 text-right font-medium">Date added</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-4">
                  <Checkbox checked={selectedUsers.has(u.id)} onCheckedChange={() => handleSelectUser(u.id)} />
                </td>
                <td className="p-4 font-medium">{u.mail}</td>
                <td className="p-4">{u.username}</td>
                <td className="p-4">{u.row}</td>
                <td className="p-4 text-right">{u.date}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 text-sm text-muted-foreground">
          Showing {start + 1}-{Math.min(start + pageSize, filteredTotalItems)} of {filteredTotalItems}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => goTo(page - 1)} disabled={page === 1}>Previous</Button>
        {pages.map((p) => (
          <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => goTo(p)}>{p}</Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => goTo(page + 1)} disabled={page === filteredTotalPages}>Next</Button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter the details of the new user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" value={newUser.mail} onChange={(e) => setNewUser({ ...newUser, mail: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="John Doe" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.row} onValueChange={(val) => setNewUser({ ...newUser, row: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Users</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedUsers.size} user(s)?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUsers}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
