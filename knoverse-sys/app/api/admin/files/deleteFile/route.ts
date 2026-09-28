import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJson, withAuth } from "@/lib/api/handler";
import { deleteTeamFile } from "@/lib/files";

// filePath is still accepted from older clients but ignored: the storage path
// is looked up server-side from fileId.
const bodySchema = z.object({ fileId: z.uuid() });

export const DELETE = withAuth(
  async (request) => {
    const { fileId } = await parseJson(request, bodySchema);
    await deleteTeamFile(fileId);
    return NextResponse.json({ message: "deleted successfully" });
  },
  { admin: true }
);
