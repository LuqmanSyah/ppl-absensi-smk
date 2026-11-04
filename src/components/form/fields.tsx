"use client";

import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectClassName } from "@/lib/styles";
import { useFormContext } from "./action-form";

type BaseProps = {
  name: string;
  label: string;
  hint?: ReactNode;
};

function useField(name: string, defaultValue?: string | number | null) {
  const { state } = useFormContext();
  const error = state.fieldErrors?.[name]?.[0];
  // Setelah gagal, tampilkan nilai yang terakhir dikirim; selain itu nilai awal dari database.
  const value = state.values?.[name] ?? (defaultValue == null ? "" : String(defaultValue));
  return { error, value, errorId: `${name}-error`, hintId: `${name}-hint` };
}

function FieldShell({
  name,
  label,
  hint,
  error,
  children,
}: BaseProps & { error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  defaultValue,
  ...props
}: BaseProps & Omit<ComponentProps<"input">, "name" | "defaultValue"> & { defaultValue?: string | number | null }) {
  const { error, value, errorId, hintId } = useField(name, defaultValue);
  const isPassword = props.type === "password";
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <Input
        id={name}
        name={name}
        // Field password tidak pernah diisi ulang.
        defaultValue={isPassword ? undefined : value}
        // `key` memaksa input membaca ulang defaultValue setelah server mengembalikan nilai.
        key={isPassword ? undefined : value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  options,
  placeholder,
  defaultValue,
}: BaseProps & {
  options: { value: string | number; label: string }[];
  placeholder?: string;
  defaultValue?: string | number | null;
}) {
  const { error, value, errorId, hintId } = useField(name, defaultValue);
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <select
        id={name}
        name={name}
        key={value}
        defaultValue={value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={selectClassName}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: BaseProps & { defaultChecked?: boolean }) {
  const { state } = useFormContext();
  const checked = state.values ? state.values[name] === "on" : !!defaultChecked;
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name={name}
          key={String(checked)}
          defaultChecked={checked}
          className="size-4 accent-primary"
        />
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="surface flex flex-col gap-5 p-5 pt-4">
      <legend className="sr-only">{title}</legend>
      <p className="-mx-5 border-b px-5 pb-3 text-sm font-semibold" aria-hidden>
        {title}
      </p>
      {children}
    </fieldset>
  );
}
