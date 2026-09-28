import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, withAuth } from "@/lib/api/handler";
import { uploadTeamFile } from "@/lib/files";
import { teamExists } from "@/lib/teams";

/*
 * Upload a PDF to Supabase storage for a team and have the AI service index it.
 */
export const POST = withAuth(
  async (request) => {
    const formData = await request.formData().catch(() => {
      throw new HttpError(400, "Expected multipart form data");
    });
    const file = formData.get("fileUpload");
    const teamId = z.uuid().safeParse(formData.get("teamId"));

    if (!(file instanceof File)) throw new HttpError(400, "No file provided");
    if (!teamId.success) throw new HttpError(400, "A valid teamId is required");
    if (!(await teamExists(teamId.data))) throw new HttpError(404, "Team not found");

    const { path } = await uploadTeamFile(teamId.data, file);

    return NextResponse.json({ message: `File ${path} uploaded successfully` });
  },
  { admin: true }
);
