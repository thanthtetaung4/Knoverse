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
// removed unused form/ui imports
import { useUser } from "@/app/providers/UserProvider";
import { useParams } from "next/navigation";

type FileRow = {
  id: string; // team_files.id
  objectId: string; // storage object id
  fileName: string | null;
  filePath: string | null;
  createdAt?: string;
};

export default function ManageUserPage() {
  const pageSize = 12;
  const [files, setFiles] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const { accessToken } = useUser();
  const params = useParams();
  const teamId = (params as unknown as { teamId?: string })?.teamId;

  // fetch files from API
  const fetchFiles = React.useCallback(async () => {
    if (!accessToken || !teamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/files?teamId=${teamId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to fetch files");
        setFiles([]);
      } else {
        const rows = (json.rows ?? []) as Array<{
          id: string | number;
          file: string;
          createdAt: string;
        }>;
		console.log("Fetched files:", rows);
        setFiles(
          rows.map((r) => ({
            id: String(r.id),
            objectId: String(r.id),
            fileName: r.file,
            filePath: r.file,
            createdAt: r.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching files", err);
      setError("Error fetching files");
    } finally {
      setLoading(false);
    }
  }, [accessToken, teamId]);

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const totalItems = files.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;
  const currentRows = files.slice(start, start + pageSize);
  const goTo = (p: number) => setPage(Math.min(totalPages, Math.max(1, p)));

  const handleSelect = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  const handleSelectAll = () => {
    if (selected.size === currentRows.length) setSelected(new Set());
    else setSelected(new Set(currentRows.map((r) => r.id)));
  };

  const handleDelete = async () => {
    if (selected.size === 0 || !accessToken) return;
    setLoading(true);
    try {
      for (const id of Array.from(selected)) {
        // find file by team_files.id
        const file = files.find((f) => f.id === id);
        if (!file) continue;
        const body = { fileId: file.objectId, filePath: file.filePath };
        const res = await fetch("/api/admin/files/deleteFile", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("Failed to delete file", file, txt);
        }
      }
      // refresh list after deletions
      setSelected(new Set());
      await fetchFiles();
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Error deleting files", err);
      alert("Failed to delete files");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken || !teamId) {
      alert("Missing auth or teamId");
      return;
    }
    const inputEl = e.currentTarget.querySelector(
      'input[name="fileUpload"]'
    ) as HTMLInputElement | null;
    const input = inputEl?.files?.[0] as File | undefined;
    if (!input) {
      alert("Please choose a file");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("fileUpload", input);
      form.append("teamId", teamId);

      const res = await fetch("/api/admin/files/uploadFile", {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: form,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setUploadError(txt || "Upload failed");
      } else {
        await fetchFiles();
      }
    } catch (err) {
      console.error("Upload error", err);
      setUploadError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-sans font-bold">Manage Files</h1>
          <p className="mt-2">Files for team {teamId}</p>
          <Separator className="my-4" />
        </div>

        <div className="mb-4 flex justify-between items-center gap-3">
          <form onSubmit={handleUpload} className="flex items-center gap-2">
            <input type="file" name="fileUpload" />
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
            {uploadError && (
              <div className="text-red-500 text-sm">{uploadError}</div>
            )}
          </form>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selected.size === 0}
            >
              Delete Selected ({selected.size})
            </Button>
            <Button variant="ghost" onClick={fetchFiles}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-8">
          {loading ? (
            <div className="p-4 text-center">Loading files…</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full border rounded-lg">
              <thead className="border-b">
                <tr>
                  <th className="w-12.5 p-4 text-left">
                    <Checkbox
                      checked={
                        selected.size === currentRows.length &&
                        currentRows.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left font-medium">File</th>
                  <th className="p-4 text-left font-medium">Object ID</th>
                  <th className="p-4 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-4">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => handleSelect(r.id)}
                      />
                    </td>
                    <td className="p-4 font-medium">{r.fileName?.slice(0, r.fileName.length - 9)}</td>
                    <td className="p-4 font-mono text-sm">{r.objectId}</td>
                    <td className="p-4 text-right">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-3 text-sm text-muted-foreground">
            Showing {start + 1}-{Math.min(start + pageSize, totalItems)} of {totalItems}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goTo(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => goTo(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => goTo(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </div>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Files</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selected.size} file(s)? This will remove the file from storage and your DB.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
