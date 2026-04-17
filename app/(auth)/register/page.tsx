import Link from "next/link";
import RegisterForm from "./RegisterForm";

interface RegisterPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { invite } = await searchParams;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Registrieren</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Konto erstellen für iGrocery
        </p>
      </div>

      <RegisterForm invite={invite} />

      <p className="text-center text-sm text-muted-foreground">
        Bereits ein Konto?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
