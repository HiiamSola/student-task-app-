"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type SignupResponse = {
  error?: string;
};

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const canSubmit = trimmedEmail !== "" && password.length >= 8 && !isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as SignupResponse | null;

      if (!response.ok) {
        setError(data?.error || "Unable to create your account.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (!signInResult || signInResult.error) {
        router.replace("/login");
        router.refresh();
        return;
      }

      router.replace(signInResult.url || "/");
      router.refresh();
    } catch {
      setError("Unable to create your account right now. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="Optional"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-describedby="signup-name-help"
        />
        <p id="signup-name-help" className="text-xs text-gray-500">
          This helps personalize the app, but you can skip it.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="signup-password-help"
        />
        <p id="signup-password-help" className="text-xs text-gray-500">
          Use at least 8 characters so your account is easier to protect.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-blue-500 px-4 py-2.5 font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
