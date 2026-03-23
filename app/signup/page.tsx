import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create account"
      subtitle="Start managing your student tasks with your own secure workspace."
      footerText="Already have an account?"
      footerLinkHref="/login"
      footerLinkLabel="Sign in"
    >
      <SignupForm />
    </AuthCard>
  );
}
