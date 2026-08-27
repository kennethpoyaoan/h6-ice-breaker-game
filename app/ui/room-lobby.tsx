"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmojiGame } from "./emoji-game";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { LeaveRoomButton } from "./leave-room-button";

type LobbyData = {
  serverNow: string;
  room: { id: string; code: string; hostName: string; status: "lobby" | "playing" | "finished" };
  players: { id: string; nickname: string; score: number }[];
  role: "host" | "player";
  viewerId: string | null;
  round: { id: string; number: number; prompt: string; answer: string | null; status: "briefing" | "answering" | "reveal"; endsAt: string | null; submissionCount: number; category: string; pattern: string } | null;
  viewerSubmission: { answer: string; is_correct: boolean; points: number } | null;
};

export function RoomLobby({ code }: { code: string }) {
  const [data, setData] = useState<LobbyData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [connection, setConnection] = useState<"connecting" | "live" | "recovering">("connecting");
  const [onlinePlayerIds, setOnlinePlayerIds] = useState<string[]>([]);
  const tokenRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const requestSequence = useRef(0);

  const loadRoom = useCallback(async () => {
    const requestId = ++requestSequence.current;
    const token = tokenRef.current ?? localStorage.getItem(`signal-scramble:${code}`);
    tokenRef.current = token;
    setAccessToken(token ?? "");
    if (!token) { setError("This browser does not have access to that room."); return; }
    try {
      const response = await fetch(`/api/rooms/${code}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const result = await response.json() as LobbyData & { error?: string };
      if (requestId !== requestSequence.current) return;
      if (!response.ok) { setError(result.error ?? "Could not load the room."); return; }
      setData(result); setError("");
    } catch {
      if (requestId === requestSequence.current) { setConnection("recovering"); setError("Connection interrupted. Reconnecting…"); }
    }
  }, [code]);

  useEffect(() => { void loadRoom(); }, [loadRoom]);
  useEffect(() => {
    if (!data?.room.id || channelRef.current) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const presenceKey = data.viewerId ?? `host:${data.room.id}`;
    const channel = supabase.channel(`room:${data.room.id}`, { config: { presence: { key: presenceKey } } })
      .on("broadcast", { event: "room_updated" }, () => void loadRoom())
      .on("presence", { event: "sync" }, () => {
        const presences = Object.values(channel.presenceState()).flat() as { playerId?: string }[];
        setOnlinePlayerIds([...new Set(presences.flatMap((presence) => presence.playerId ? [presence.playerId] : []))]);
      })
      .subscribe((status) => {
      if (status === "SUBSCRIBED") { setConnection("live"); void channel.track({ playerId: data.viewerId, role: data.role, joinedAt: new Date().toISOString() }); void loadRoom(); }
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnection("recovering");
    });
    channelRef.current = channel;
    return () => { void supabase.removeChannel(channel); channelRef.current = null; };
  }, [data?.room.id, data?.role, data?.viewerId, loadRoom]);
  useEffect(() => {
    if (!data?.room.id) return;
    const interval = data.round?.status === "answering" ? 3000 : 10000;
    const timer = window.setInterval(() => void loadRoom(), interval);
    return () => window.clearInterval(timer);
  }, [data?.room.id, data?.round?.status, loadRoom]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible" && navigator.onLine) void loadRoom(); };
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [loadRoom]);

  async function startGame() {
    if (!tokenRef.current) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/rooms/${code}/start`, { method: "POST", headers: { Authorization: `Bearer ${tokenRef.current}` } });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Could not start the game."); else await loadRoom();
    setBusy(false);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(`${window.location.origin}\nRoom code: ${code}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  }

  if (error && !data) return <main className="center-page"><section className="message-card"><span className="card-icon">!</span><h1>Can’t enter this room</h1><p>{error}</p><Link href="/" className="primary-button">Back home</Link></section></main>;
  if (!data) return <main className="center-page"><div className="loader" aria-label="Loading room" /></main>;

  const me = data.players.find((player) => player.id === data.viewerId);
  if (data.room.status !== "lobby") {
    return <EmojiGame key={data.round?.id ?? data.room.status} code={code} data={data} token={accessToken} onRefresh={loadRoom} connection={connection} onlinePlayerIds={onlinePlayerIds} />;
  }
  return <main className="lobby-shell">
    <header className="lobby-header"><Link href="/" className="brand-mark"><span>✦</span> Signal Scramble</Link><div className="header-status"><span className={`sync-status ${connection}`}>{connection === "live" ? "● Synced" : connection === "recovering" ? "↻ Reconnecting" : "○ Connecting"}</span><span className="role-pill">{data.role === "host" ? "Host view" : `Playing as ${me?.nickname ?? "player"}`}</span>{data.role === "player" && <LeaveRoomButton code={code} token={accessToken} />}</div></header>
    <section className="room-code-panel"><div><p className="eyebrow">Join at this website with room code</p><div className="room-code">{data.room.code}</div></div><button className="secondary-button" onClick={copyInvite}>{copied ? "Copied!" : "Copy invite"}</button></section>
    <section className="lobby-grid">
      <div className="players-panel">
        <div className="panel-title"><div><p className="eyebrow">The crew</p><h1>{data.players.length} of 20 players</h1></div><span className="live-dot">● Live</span></div>
        <div className="player-grid">
          {data.players.map((player, index) => { const offline = connection === "live" && !onlinePlayerIds.includes(player.id); return <article className={`player-card${offline ? " offline" : ""}`} key={player.id}><span className={`avatar avatar-${index % 5}`}>{player.nickname.charAt(0).toUpperCase()}</span><strong>{player.nickname}</strong><small>{player.id === data.viewerId ? "You · Online" : offline ? "Offline — can reconnect" : "Online"}</small></article>; })}
          {Array.from({ length: Math.min(4, Math.max(0, 4 - data.players.length)) }, (_, index) => <article className="player-card empty" key={`empty-${index}`}>+</article>)}
        </div>
      </div>
      <aside className="host-panel"><span className="card-icon">{data.room.status === "lobby" ? "⌛" : "⚡"}</span><h2>{data.room.status === "lobby" ? "Waiting for the crew" : "The scramble begins!"}</h2><p>{data.room.status === "lobby" ? `${data.room.hostName} will start when everyone is ready.` : "The first mini-game is coming next."}</p>{data.role === "host" && data.room.status === "lobby" && <button className="primary-button" disabled={busy || data.players.length < 2} onClick={startGame}>{busy ? "Starting…" : "Start game →"}</button>}{data.role === "host" && data.players.length < 2 && <small>Invite at least 2 players to begin.</small>}{data.role === "player" && <div className="pulse-bars"><i /><i /><i /></div>}</aside>
    </section>
    {error && <p className="toast" role="alert">{error}</p>}
  </main>;
}
