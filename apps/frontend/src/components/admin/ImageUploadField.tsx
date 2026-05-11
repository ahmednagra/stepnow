// src/components/admin/ImageUploadField.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageOff } from "lucide-react";
import { uploadAdminFile } from "@/services/uploads";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { adminInputClass } from "./AdminFormField";

interface ImageUploadFieldProps {
  /** Controlled URL value (the underlying form field). */
  value: string | null | undefined;
  /** Called with the new URL (from upload) or the user's typed URL. */
  onChange: (value: string) => void;
  disabled?: boolean;
  /** aria-describedby target for an error message under the input. */
  ariaDescribedBy?: string;
  /** Optional placeholder for the URL input. */
  placeholder?: string;
  /** Optional className on the wrapper. */
  className?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export function ImageUploadField({
  value,
  onChange,
  disabled,
  ariaDescribedBy,
  placeholder = "https:// or upload an image",
  className,
}: ImageUploadFieldProps) {
  const pushToast = useAdminToast((s) => s.push);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const onPickFile = useCallback(() => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  }, [disabled, uploading]);

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Always reset the input so the same file can be re-selected after an error
      e.target.value = "";
      if (!file) return;

      setUploading(true);
      try {
        const result = await uploadAdminFile(file);
        onChange(result.url);
        setPreviewError(false);
        pushToast("success", "Image uploaded", `${result.width}×${result.height}px`);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Upload failed";
        pushToast("error", "Upload failed", msg);
      } finally {
        setUploading(false);
      }
    },
    [onChange, pushToast],
  );

  const hasValue = !!value && value.length > 0;

  return (
    <div className={className}>
      <div className="flex items-stretch gap-2">
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => {
            onChange(e.target.value);
            setPreviewError(false);
          }}
          disabled={disabled || uploading}
          placeholder={placeholder}
          aria-describedby={ariaDescribedBy}
          className={`${adminInputClass} flex-1 font-mono text-[12px]`}
        />
        <button
          type="button"
          onClick={onPickFile}
          disabled={disabled || uploading}
          className="inline-flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={hasValue ? "Replace image" : "Upload image"}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {hasValue && !uploading && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setPreviewError(false);
            }}
            disabled={disabled}
            title="Clear image"
            className="inline-flex h-9 w-9 items-center justify-center border border-slate-300 bg-white text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFileSelected}
        className="hidden"
        aria-hidden="true"
      />

      {hasValue && (
        <div className="mt-2 inline-block border border-slate-200 bg-slate-50 p-1">
          {previewError ? (
            <div className="flex h-20 w-32 items-center justify-center gap-1.5 text-slate-400">
              <ImageOff className="h-4 w-4" />
              <span className="text-[11px]">Preview failed</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value!}
              alt="Preview"
              className="block h-20 w-auto max-w-xs object-contain"
              onError={() => setPreviewError(true)}
              onLoad={() => setPreviewError(false)}
            />
          )}
        </div>
      )}

      <p className="mt-1 text-[10px] text-slate-400">
        JPEG, PNG, WebP, AVIF · 10 MB max · 100–8000 px
      </p>
    </div>
  );
}
