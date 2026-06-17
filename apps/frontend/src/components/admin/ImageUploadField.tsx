// apps/frontend/src/components/admin/ImageUploadField.tsx
// Phase 3d polish — refined image upload tile with preview, replace, clear.
// Stays restrained per admin palette.

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { resolveMediaUrl } from "@/utils/media-url";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  /** Called with the file to upload. Should resolve to the URL. */
  onUpload: (file: File) => Promise<string>;
  hint?: string;
  className?: string;
  /** Aspect ratio class for the preview frame. Default 'aspect-[4/3]'. */
  aspect?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
  hint,
  className,
  aspect = "aspect-[4/3]",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const previewUrl = resolveMediaUrl(value);

  async function pickFile(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-[12px] font-medium tracking-tight text-slate-700">{label}</span>
      <div className="relative">
        {previewUrl ? (
          <div className={cn("relative w-full overflow-hidden border border-slate-200 bg-slate-100", aspect)}>
            <Image src={previewUrl} alt={`${label} preview`} fill className="object-cover" sizes="(min-width: 768px) 30vw, 90vw" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center bg-white/90 text-slate-700 transition-colors hover:text-rose-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 disabled:opacity-50",
              aspect,
            )}
          >
            <ImagePlus className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-[12px]">{uploading ? "Uploading…" : "Click to upload"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pickFile(f);
          e.target.value = "";
        }}
      />
      {hint && !err && <p className="text-[11.5px] text-slate-500">{hint}</p>}
      {err && <p className="text-[11.5px] font-medium text-rose-700">{err}</p>}
      {previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-start text-[11.5px] font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-700"
        >
          Replace image
        </button>
      )}
    </div>
  );
}
