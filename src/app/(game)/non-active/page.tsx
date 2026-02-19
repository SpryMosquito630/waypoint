import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getRepeatLabel } from "@/lib/tasks/repeat";

export default async function NonActivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("player_id", user.id)
    .or("status.eq.completed,completed_at.not.is.null")
    .order("completed_at", { ascending: false })
    .limit(200);

  async function clearHistory() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await supabase
      .from("tasks")
      .update({ completed_at: null })
      .eq("player_id", user.id)
      .eq("status", "completed");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Non-active
            </p>
            <h1 className="text-lg font-semibold text-amber-100">
              Past completed tasks
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <form action={clearHistory}>
              <button className="text-xs rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-amber-100 hover:bg-amber-500/30 transition-colors">
                Clear
              </button>
            </form>
            <Link
              href="/dashboard?mode=bounty"
              className="text-xs rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-amber-100 hover:bg-amber-500/20 transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!tasks || tasks.length === 0 ? (
          <p className="text-sm text-amber-200/70">No completed tasks yet.</p>
        ) : (
          <>
            {tasks.filter((t) => t.is_permanent).length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-amber-200/60">
                  Completed permanent
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tasks.filter((t) => t.is_permanent).map((task) => (
                    <div
                      key={task.id}
                      className="bounty-poster opacity-80"
                    >
                      <div className="bounty-poster-inner">
                        <p className="bounty-title">Wanted</p>
                        <p className="bounty-name">{task.title}</p>
                        {task.description && (
                          <p className="bounty-desc">{task.description}</p>
                        )}
                        <div className="bounty-meta">
                          <span>Reward +{task.difficulty}</span>
                          <span>
                            Completed{" "}
                            {task.completed_at
                              ? format(
                                  new Date(task.completed_at),
                                  "MMM d, h:mm a"
                                )
                              : "Unknown"}
                          </span>
                          <span>{getRepeatLabel(task) ?? "Permanent"}</span>
                        </div>
                        <div className="bounty-actions">
                          <div className="bounty-btn">Completed</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-amber-200/60">
                Completed tasks
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {tasks.filter((t) => !t.is_permanent).map((task) => (
              <div
                key={task.id}
                className="bounty-poster opacity-70"
              >
                <div className="bounty-poster-inner">
                  <p className="bounty-title">Wanted</p>
                  <p className="bounty-name">{task.title}</p>
                  {task.description && (
                    <p className="bounty-desc">{task.description}</p>
                  )}
                  <div className="bounty-meta">
                    <span>Reward +{task.difficulty}</span>
                    <span>
                      Completed{" "}
                      {task.completed_at
                        ? format(new Date(task.completed_at), "MMM d, h:mm a")
                        : "Unknown"}
                    </span>
                    {task.is_permanent && (
                      <span>{getRepeatLabel(task) ?? "Permanent"}</span>
                    )}
                  </div>
                  <div className="bounty-actions">
                    <div className="bounty-btn">Completed</div>
                  </div>
                </div>
              </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
