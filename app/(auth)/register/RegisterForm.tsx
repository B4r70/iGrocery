"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  invite?: string;
}

export default function RegisterForm({ invite }: RegisterFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { invite },
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("displayName", data.displayName);
    if (data.invite) {
      formData.set("invite", data.invite);
    }

    const result = await signUp(formData);
    // signUp redirects on success — if we get here, there was an error
    if (result?.error) {
      setServerError(result.error);
    }
    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      {invite && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          Du wirst einem bestehenden Haushalt beitreten.
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      {/* Hidden invite token — submitted with form data */}
      {invite && <input type="hidden" {...register("invite")} value={invite} />}

      <div className="space-y-1">
        <Label htmlFor="displayName">Name</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          placeholder="Dein Name"
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.de"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full min-h-[44px]"
        disabled={isPending}
      >
        {isPending ? "Registrieren…" : "Registrieren"}
      </Button>
    </form>
  );
}
