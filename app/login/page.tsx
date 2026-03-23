import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
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