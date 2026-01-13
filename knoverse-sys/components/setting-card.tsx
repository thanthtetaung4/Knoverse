"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "@/app/providers/UserProvider";

interface SettingsPageCardProps {
  compact?: boolean;
}

export default function SettingsPageCard({
  compact = false,
}: SettingsPageCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const { accessToken } = useUser();

  const handlePwdChange = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Failed to send reset email");
      } else {
        setMessage(json?.message ?? "Password reset email sent");
      }
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  return (
    <div className={compact ? "" : "flex justify-center"}>
      <div
        className={`flex flex-col gap-4 items-center ${
          compact
            ? "p-2"
            : "my-32 p-20 border border-2 rounded-sm sm:max-w-1/3 md:max-w-2/3"
        }`}
      >
        {!compact && (
          <label className="text-md font-semibold">New Password</label>
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
          className="px-3 py-2 border rounded w-full"
        />
        <div className={compact ? "mt-2" : "mt-8"}>
          <Button onClick={handlePwdChange} disabled={loading || !password}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
