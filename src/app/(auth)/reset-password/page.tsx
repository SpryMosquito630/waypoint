"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "checking" | "ready" | "error" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    const finalize = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("Reset link is invalid or expired.");
          setStatus("error");
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError("Reset link is invalid or expired.");
        setStatus("error");
        return;
      }
      setStatus("ready");
    };

    void finalize();
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated. Redirecting to sign in...");
    setStatus("done");
    await supabase.auth.signOut();
    window.setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
          <p className="text-zinc-400 text-sm">
            Set a new password for your account.
          </p>
        </CardHeader>
        <CardContent>
          {status === "checking" && (
            <p className="text-sm text-zinc-400">Validating reset link...</p>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-red-400">{error}</p>
              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                Back to sign in
              </Button>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-zinc-300">
                  Confirm password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  minLength={6}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {message && <p className="text-sm text-emerald-400">{message}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

          {status === "done" && message && (
            <p className="text-sm text-emerald-400">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
