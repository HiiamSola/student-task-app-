import { redirect } from "next/navigation";
import { TaskManager } from "@/components/task-manager";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <TaskManager user={user} />;
}
