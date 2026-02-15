import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TasksClient } from "./client";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <TasksClient userId={user.id} />;
}
