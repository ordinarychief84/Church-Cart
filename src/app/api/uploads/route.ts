import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth/guards";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const folder = (form.get("folder") as string) || "products";
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (folder !== "products" && folder !== "vendors" && folder !== "churches") {
    return NextResponse.json({ error: "bad_folder" }, { status: 400 });
  }

  try {
    const result = await uploadImage(file, folder);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
