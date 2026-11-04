"use client";

// Tombol untuk aksi satu klik (nonaktifkan akun, hapus jadwal) dengan konfirmasi sederhana.
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/forms";

export function ConfirmActionButton({
  action,
  label,
  confirmLabel,
  variant = "outline",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  /** Teks pertanyaan konfirmasi. Jika kosong, aksi langsung dijalankan. */
  confirmLabel?: string;
  variant?: "outline" | "destructive" | "default";
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {confirming || !confirmLabel ? (
        <div className="flex flex-wrap items-center gap-2">
          {confirmLabel && <span className="text-sm">{confirmLabel}</span>}
          <Button type="submit" variant={variant} size="sm" disabled={pending}>
            {pending ? "Memproses..." : confirmLabel ? "Ya, lanjutkan" : label}
          </Button>
          {confirmLabel && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          )}
        </div>
      ) : (
        <div>
          <Button type="button" variant={variant} size="sm" onClick={() => setConfirming(true)}>
            {label}
          </Button>
        </div>
      )}
      {state.message && (
        <p className={state.success ? "text-sm text-muted-foreground" : "text-sm text-destructive"} aria-live="polite">
          {state.message}
        </p>
      )}
    </form>
  );
}
