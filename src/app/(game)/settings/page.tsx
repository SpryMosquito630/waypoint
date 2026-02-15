import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-500">Settings</h1>
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile info */}
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>
              <span className="text-white">{profile?.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Role</span>
              <span className="text-white capitalize">{profile?.role}</span>
            </div>
          </div>
        </div>

        {/* Parent linking */}
        {profile?.role === "parent" && profile?.invite_code && (
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-300">
              Invite Code
            </h2>
            <p className="text-2xl font-mono font-bold text-blue-400 tracking-widest">
              {profile.invite_code}
            </p>
            <p className="text-xs text-zinc-500">
              Share this code with your child so they can link their account.
            </p>
          </div>
        )}

        {profile?.role === "player" && (
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-300">
              Parent Link
            </h2>
            {profile.parent_id ? (
              <p className="text-sm text-green-400">
                Linked to parent account
              </p>
            ) : (
              <Link
                href="/link-parent"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                Link Parent Account
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
