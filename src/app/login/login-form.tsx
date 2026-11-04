"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.message && (
        <Alert variant="destructive" aria-live="polite">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          defaultValue={state.username}
          aria-invalid={!!state.fieldErrors?.username}
          aria-describedby="username-error"
          className="h-11"
          required
        />
        {state.fieldErrors?.username && (
          <p id="username-error" className="text-sm text-destructive">
            {state.fieldErrors.username[0]}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Siswa memakai NIS sebagai username.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state.fieldErrors?.password}
          aria-describedby="password-error"
          className="h-11"
          required
        />
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
        {pending ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
