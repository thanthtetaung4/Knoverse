import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { objects, teamFiles } from "@/db/schema";
import { callAiService } from "@/lib/aiService";
import { HttpError } from "@/lib/api/handler";
import { createAdminClient, FILES_BUCKET } from "@/lib/supabase/admin";

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 20) * 1024 * 1024;

/** Keep the original name readable but safe as a storage key. */
function safeFileName(name: string) {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._]+/, "");
  return (cleaned || "document.pdf").slice(-120);
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Store a PDF for a team and index it. Stored at `<teamId>/<uuid>/<name>` so
 * names never collide and the extension is preserved. If indexing fails, the
 * upload is rolled back so no un-indexed file is left behind.
 */
export async function uploadTeamFile(teamId: string, file: File) {
  if (!isPdf(file)) throw new HttpError(415, "Only PDF files are supported");
  if (file.size === 0) throw new HttpError(400, "File is empty");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(413, `File is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`);
  }

  const supabase = createAdminClient();
  const path = `${teamId}/${randomUUID()}/${safeFileName(file.name)}`;

  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(path, file, { contentType: "application/pdf" });
  if (error) throw error;

  const fileId = data.id;
  try {
    await db.insert(teamFiles).values({ teamId, objectId: fileId });
    await callAiService("/uploadFile", "POST", { fileName: data.path, teamId, fileId });
  } catch (err) {
    // Best-effort rollback of every step that may have succeeded.
    await callAiService("/deleteFile", "DELETE", { fileId }).catch(() => {});
    await db.delete(teamFiles).where(eq(teamFiles.objectId, fileId)).catch(() => {});
    await supabase.storage.from(FILES_BUCKET).remove([data.path]).catch(() => {});
    throw err;
  }

  return { fileId, path: data.path };
}

/**
 * Remove a team file everywhere: vectors first (so it can no longer be
 * retrieved), then the storage object, then the DB row. Each step is safe to
 * repeat, so a failed delete can simply be retried.
 * The storage path is looked up server-side, never taken from the client.
 */
export async function deleteTeamFile(fileId: string) {
  const rows = await db
    .select({ name: objects.name })
    .from(teamFiles)
    .innerJoin(objects, eq(objects.id, teamFiles.objectId))
    .where(eq(teamFiles.objectId, fileId))
    .limit(1);
  if (rows.length === 0) throw new HttpError(404, "File not found");

  await callAiService("/deleteFile", "DELETE", { fileId });

  const { error } = await createAdminClient().storage.from(FILES_BUCKET).remove([rows[0].name]);
  if (error) throw error;

  await db.delete(teamFiles).where(eq(teamFiles.objectId, fileId));
}

/** Delete all of a team's files; used before deleting the team itself. */
export async function deleteAllTeamFiles(teamId: string) {
  const files = await db
    .select({ objectId: teamFiles.objectId })
    .from(teamFiles)
    .where(eq(teamFiles.teamId, teamId));

  for (const file of files) {
    await deleteTeamFile(file.objectId);
  }
}
