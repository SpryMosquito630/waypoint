import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PermanentTasksClient } from "./client";

export default async function PermanentTasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <PermanentTasksClient userId={user.id} />;
}
