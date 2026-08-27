"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "join" | "host";

export function HomeLobby() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("join");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        mode === "host" ? "/api/rooms" : "/api/rooms/join",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "host" ? { hostName: name } : { nickname: name, code },
          ),
        },
      );
      const result = (await response.json()) as {
        code?: string;
        token?: string;
        error?: string;
      };
      if (!response.ok || !result.code || !result.token)
        throw new Error(result.error ?? "Something went wrong.");
      localStorage.setItem(`signal-scramble:${result.code}`, result.token);
      router.push(`/room/${result.code}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="site-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <section className="hero-copy">
        <div className="brand-mark mb-4">
          <span>✦</span> Signal Scramble
        </div>
        {/* <p className="eyebrow">A 45-minute meeting remix</p> */}
        <h1>
          Turn awkward silence into <em>friendly chaos.</em>
        </h1>
        {/* <p className="lede">
          Quick creative games for your whole team. No downloads, no
          accounts—just a room code and good energy.
        </p> */}
        <div className="feature-row">
          {/* <span>⚡ 3–20 players</span>
          <span>◷ 45 minutes</span> */}
          <span>⌁ Any device</span>
        </div>
      </section>
      <section className="entry-card" aria-labelledby="entry-title">
        <div className="mode-tabs">
          <button
            className={mode === "join" ? "active" : ""}
            onClick={() => {
              setMode("join");
              setError("");
            }}
          >
            Join a game
          </button>
          <button
            className={mode === "host" ? "active" : ""}
            onClick={() => {
              setMode("host");
              setError("");
            }}
          >
            Host a game
          </button>
        </div>
        <div className="card-body">
          <div className="card-icon">{mode === "join" ? "↗" : "✦"}</div>
          <h2 id="entry-title">
            {mode === "join" ? "Ready to play?" : "Lead the scramble"}
          </h2>
          <p>
            {mode === "join"
              ? "Enter the code on your host’s screen."
              : "Create a private room and invite your team."}
          </p>
          <form onSubmit={submit}>
            {mode === "join" && (
              <label>
                Room code
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z2-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder="ABC234"
                  autoCapitalize="characters"
                  autoComplete="off"
                  required
                />
              </label>
            )}
            <label>
              {mode === "join" ? "Your name" : "Host name"}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
                maxLength={24}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button" disabled={loading}>
              {loading
                ? "One moment…"
                : mode === "join"
                  ? "Join the scramble →"
                  : "Create game →"}
            </button>
          </form>
          <p className="privacy-note">
            ♙ No sign-up required. Your room disappears when the fun is over.
          </p>
        </div>
      </section>
    </main>
  );
}
