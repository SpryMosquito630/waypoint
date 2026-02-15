"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LinkParentPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.rpc("link_parent", {
      p_invite_code: inviteCode.trim().toLowerCase(),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Link Parent</CardTitle>
          <p className="text-zinc-400 text-sm">
            Enter your parent&apos;s invite code to connect accounts
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <p className="text-green-400 text-lg font-medium">
                Linked successfully!
              </p>
              <p className="text-zinc-500 text-sm mt-2">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-zinc-300">
                  Invite Code
                </Label>
                <Input
                  id="code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. a3f2b1"
                  maxLength={6}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white text-center text-xl tracking-widest"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {loading ? "Linking..." : "Link Account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
