import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Willkommen zurück bei iGrocery
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Registrieren
        </Link>
      </p>
    </div>
  );
}
