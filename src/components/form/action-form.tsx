"use client";

// Form generik untuk Server Action. Field di dalamnya (TextField, SelectField, ...) membaca
// pesan error dan nilai sebelumnya lewat context, jadi halaman cukup menyusun field-nya saja.
import { createContext, startTransition, use, useActionState, useEffect, useRef, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { initialFormState, type FormState } from "@/lib/forms";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const FormContext = createContext<{ state: FormState; pending: boolean }>({
  state: initialFormState,
  pending: false,
});

export function useFormContext() {
  return use(FormContext);
}

export function ActionForm({
  action,
  submitLabel = "Simpan",
  children,
  className,
}: {
  action: Action;
  submitLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  // Saat gagal isian dipertahankan; saat berhasil (tanpa pindah halaman) form dikosongkan
  // agar pengguna tahu datanya sudah terkirim dan tidak mengirim ulang.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <FormContext value={{ state, pending }}>
      <form
        ref={formRef}
        action={formAction}
        // Tanpa ini React mengosongkan form setelah action selesai, sehingga isian hilang saat gagal.
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => formAction(formData));
        }}
        noValidate
        className={className ?? "flex max-w-xl flex-col gap-5"}
      >
        {state.message && (
          <Alert variant={state.success ? "default" : "destructive"} aria-live="polite">
            {state.success && <CheckCircle2 aria-hidden />}
            <AlertDescription className="whitespace-pre-line">{state.message}</AlertDescription>
          </Alert>
        )}
        {children}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : submitLabel}
          </Button>
        </div>
      </form>
    </FormContext>
  );
}
