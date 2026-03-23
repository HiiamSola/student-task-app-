import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your tasks and organize your work."
      footerText="Don't have an account?"
      footerLinkHref="/signup"
      footerLinkLabel="Create one"
    >
      <LoginForm />
    </AuthCard>
  );
}
