// Client-side upload to Supabase Storage via its REST API (no SDK dependency).
// Requires a PUBLIC bucket named `progress-photos` with an INSERT policy that
// allows the anon role. Configured through NEXT_PUBLIC_* env vars.

const BUCKET = "progress-photos";

export function photosEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function uploadPhoto(file: File): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase storage is not configured");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${msg}`);
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}
