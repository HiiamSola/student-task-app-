"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-500"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
