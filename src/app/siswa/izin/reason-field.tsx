"use client";

import { Label } from "@/components/ui/label";
import { useFormContext } from "@/components/form/action-form";

/** Textarea alasan yang ikut membaca error dan nilai sebelumnya dari ActionForm. */
export function ReasonField() {
  const { state } = useFormContext();
  const error = state.fieldErrors?.reason?.[0];
  const value = state.values?.reason ?? "";
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="reason">Alasan</Label>
      <textarea
        id="reason"
        name="reason"
        key={value}
        defaultValue={value}
        rows={3}
        maxLength={500}
        placeholder="Contoh: Demam sejak semalam, surat dokter menyusul."
        aria-invalid={!!error}
        aria-describedby={error ? "reason-error" : undefined}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 shadow-xs text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
      />
      {error && (
        <p id="reason-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
