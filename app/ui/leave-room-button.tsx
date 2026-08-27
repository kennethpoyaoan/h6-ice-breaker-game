"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeaveRoomButton({ code, token }: { code: string; token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leaveRoom() {
    setBusy(true); setError("");
    const response = await fetch(`/api/rooms/${code}/players/me`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setError(result.error ?? "Could not leave the room."); setBusy(false); return; }
    localStorage.removeItem(`signal-scramble:${code}`);
    router.replace("/");
  }

  return <>
    <button className="leave-button" onClick={() => setOpen(true)}>Leave room</button>
    {open && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="leave-title" aria-describedby="leave-description">
        <div className="dialog-icon">↗</div><h2 id="leave-title">Leave this room?</h2><p id="leave-description">Your seat, current score, and submitted answers will be removed. You can rejoin later as a new player if the room is still open.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button className="secondary-button" disabled={busy} onClick={() => setOpen(false)}>Stay in game</button><button className="danger-button" disabled={busy} onClick={leaveRoom}>{busy ? "Leaving…" : "Yes, leave room"}</button></div>
      </section>
    </div>}
  </>;
}
