// src/services/uploads/uploads.admin.client.ts
import { ApiError, ERROR_CODES, type ApiErrorBody } from "@/lib/api-errors";
import { getAccessToken } from "@/lib/auth-storage";

export interface UploadedFile {
  url: string;
  size_bytes: number;
  content_type: string;
  width: number;
  height: number;
  original_filename: string;
}

/**
 * Upload a single image file via the admin BFF.
 * Returns the public URL plus metadata. Caller stores `url` into their form field.
 *
 * Backend enforces: max 10MB, image/jpeg|png|webp|avif, 100–8000px dimensions.
 * On validation failure the backend returns 400 with a localized message.
 */
export async function uploadAdminFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch("/api/v0/admin/uploads", {
      method: "POST",
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    throw new ApiError(ERROR_CODES.BACKEND_UNREACHABLE, "Network error during upload", 0);
  }

  if (!res.ok) {
    // Backend error envelope is { error: { code, message, extra } }
    let body: { error?: ApiErrorBody } | null = null;
    try {
      body = (await res.json()) as { error?: ApiErrorBody };
    } catch {
      /* swallow */
    }
    const err = body?.error;
    throw new ApiError(
      err?.code ?? ERROR_CODES.UNKNOWN,
      err?.message ?? `Upload failed (${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as UploadedFile;
}
