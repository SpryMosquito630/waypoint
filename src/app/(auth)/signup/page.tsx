"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"player" | "parent">("player");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setResetError("Enter your email first.");
      setResetMessage(null);
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setResetError("Unable to send reset link. Please try again.");
    } else {
      setResetMessage("Password reset link sent. Check your inbox.");
    }
    setResetLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Join Waypoint AI</CardTitle>
          <p className="text-zinc-400 text-sm">
            Start your journey
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">
                Display Name
              </Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
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
              <Label className="text-zinc-300">I am a...</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("player")}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    role === "player"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Player
                </button>
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    role === "parent"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Parent / Guardian
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
            <p className="text-xs uppercase tracking-widest text-zinc-400">
              Forgot password
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              We will send a reset link to the email above.
            </p>
            <Button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              {resetLoading ? "Sending link..." : "Send reset link"}
            </Button>
            {resetError && (
              <p className="mt-2 text-xs text-red-400">{resetError}</p>
            )}
            {resetMessage && (
              <p className="mt-2 text-xs text-emerald-400">{resetMessage}</p>
            )}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
