import { NextResponse } from "next/server";
import { uploadImage, type UploadFolder } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth/guards";

export const runtime = "nodejs";

const ALLOWED_BY_ROLE: Record<UploadFolder, string[]> = {
  products: ["VENDOR"],
  vendors: ["VENDOR"],
  churches: ["CHURCH_ADMIN"],
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = (form.get("folder") as string) || "";
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (folderRaw !== "products" && folderRaw !== "vendors" && folderRaw !== "churches") {
    return NextResponse.json({ error: "bad_folder" }, { status: 400 });
  }
  const folder = folderRaw as UploadFolder;

  const allowed = ALLOWED_BY_ROLE[folder];
  if (!allowed.includes(user.role) && user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await uploadImage(file, folder);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
