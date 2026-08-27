"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { EMOJI_ROUND_COUNT } from "@/lib/game-content";
import { LeaveRoomButton } from "./leave-room-button";

type GameData = {
  serverNow: string;
  room: { id: string; code: string; hostName: string; status: "lobby" | "playing" | "finished" };
  players: { id: string; nickname: string; score: number }[];
  role: "host" | "player";
  viewerId: string | null;
  round: { id: string; number: number; prompt: string; answer: string | null; status: "briefing" | "answering" | "reveal"; endsAt: string | null; submissionCount: number; category: string; pattern: string } | null;
  viewerSubmission: { answer: string; is_correct: boolean; points: number } | null;
};

export function EmojiGame({ code, data, token, onRefresh, connection, onlinePlayerIds }: { code: string; data: GameData; token: string; onRefresh: () => Promise<void>; connection: "connecting" | "live" | "recovering"; onlinePlayerIds: string[] }) {
  const [guess, setGuess] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);
  const round = data.round;

  useEffect(() => {
    if (round?.status !== "answering") return;
    const kickoff = window.setTimeout(() => {
      setClockOffset(new Date(data.serverNow).getTime() - Date.now());
      setNow(Date.now());
    }, 0);
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearTimeout(kickoff); window.clearInterval(timer); };
  }, [round?.status, round?.id, data.serverNow]);

  const secondsLeft = round?.endsAt && now > 0 ? Math.max(0, Math.ceil((new Date(round.endsAt).getTime() - (now + clockOffset)) / 1000)) : 45;

  async function hostAction(action: "begin" | "reveal" | "next") {
    setBusy(true); setError("");
    const response = await fetch(`/api/rooms/${code}/round`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Could not update the round."); else await onRefresh();
    setBusy(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch(`/api/rooms/${code}/answer`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ answer: guess }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Could not submit your guess."); else await onRefresh();
    setBusy(false);
  }

  const ranking = [...data.players].sort((a, b) => b.score - a.score);
  if (data.room.status === "finished") return <main className="game-shell"><header className="game-top"><Link href="/" className="brand-mark"><span>✦</span> Signal Scramble</Link><span className="round-pill">Final scores</span></header><section className="podium-card"><p className="eyebrow">Emoji Transmission complete</p><h1>🏆 {ranking[0]?.nickname ?? "Great game!"}</h1><div className="score-list">{ranking.map((player, index) => <div key={player.id}><strong>{index + 1}. {player.nickname}</strong><span>{player.score.toLocaleString()} pts</span></div>)}</div><Link className="primary-button" href="/">Play again</Link></section></main>;

  if (!round) return <main className="center-page"><section className="message-card"><span className="card-icon">!</span><h1>Round setup required</h1><p>Apply the Emoji Transmission database migration, then create a fresh room.</p><Link href="/" className="primary-button">Back home</Link></section></main>;

  return <main className="game-shell">
    <header className="game-top"><div className="brand-mark"><span>✦</span> Signal Scramble</div><div className="header-status"><span className={`sync-status ${connection}`}>{connection === "live" ? "● Synced" : connection === "recovering" ? "↻ Reconnecting" : "○ Connecting"}</span><span className="round-pill">Emoji Transmission · {round.number}/{EMOJI_ROUND_COUNT}</span>{data.role === "player" && <LeaveRoomButton code={code} token={token} />}</div></header>
    <section className="game-stage">
      <div className="game-card">
        {round.status === "briefing" && round.number === 1 && <><p className="eyebrow">How to play</p><h1>Decode the emoji signal</h1><p className="game-instructions">A familiar phrase is hiding behind the emojis. Use the category and letter pattern as clues, then lock in one guess before time runs out.</p><div className="example-signal">🌧️ 🐱 🐶</div><small>Example: “Raining cats and dogs”</small><div className="scoring-guide"><div><strong>75</strong><span>base points for a correct answer</span></div><b>+</b><div><strong>5 × seconds</strong><span>remaining when you submit</span></div><b>=</b><div className="max-score"><strong>Up to 300</strong><span>points per signal</span></div></div><p className="scoring-note">Small one-letter spelling mistakes are accepted. Incorrect or late answers earn 0 points. Scores are added when the host reveals the answer.</p>{data.role === "host" ? <button className="primary-button game-action" disabled={busy} onClick={() => hostAction("begin")}>Open answers →</button> : <div className="waiting-chip">Waiting for {data.room.hostName}…</div>}</>}
        {round.status === "briefing" && round.number > 1 && <><p className="eyebrow">Next transmission</p><div className="round-progress" aria-label={`Round ${round.number} of ${EMOJI_ROUND_COUNT}`}>{Array.from({ length: EMOJI_ROUND_COUNT }, (_, i) => i + 1).map((step) => <i className={step <= round.number ? "active" : ""} key={step} />)}</div><h1>Signal {round.number} is ready</h1><p className="game-instructions">Take a breath and make sure everyone is watching. The 45-second timer starts when the host launches the signal.</p>{data.role === "host" ? <button className="primary-button game-action" disabled={busy} onClick={() => hostAction("begin")}>Launch signal {round.number} →</button> : <div className="waiting-chip">The next signal launches soon…</div>}</>}
        {round.status === "answering" && <><div className="timer-ring" style={{ "--progress": `${(secondsLeft / 45) * 360}deg` } as React.CSSProperties}><strong>{secondsLeft}</strong><small>seconds</small></div><p className="eyebrow">Decode this</p><div className="emoji-prompt">{round.prompt}</div><div className="clue-strip"><span>Category: <strong>{round.category}</strong></span><span>Answer: <strong>{round.pattern}</strong></span></div>{data.role === "player" && !data.viewerSubmission && secondsLeft > 0 && <form className="guess-form" onSubmit={submit}><label>Your guess<input autoFocus value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Type the phrase…" maxLength={80} /></label><button className="primary-button" disabled={busy || !guess.trim()}>Lock it in</button></form>}{data.role === "player" && !data.viewerSubmission && secondsLeft === 0 && <div className="time-up-message"><strong>Time’s up!</strong><span>Waiting for the host to reveal the answer.</span></div>}{data.viewerSubmission && <div className="answer-locked">✓ Answer locked: <strong>{data.viewerSubmission.answer}</strong></div>}{data.role === "host" && <><p className="submission-count"><strong>{round.submissionCount}</strong> of {data.players.length} answers received</p><button className="primary-button game-action" disabled={busy} onClick={() => hostAction("reveal")}>Reveal answer →</button></>}</>}
        {round.status === "reveal" && <><p className="eyebrow">The signal says…</p><div className="emoji-prompt">{round.prompt}</div><h1 className="reveal-answer">{round.answer}</h1>{data.viewerSubmission && <div className={data.viewerSubmission.is_correct ? "result correct" : "result wrong"}>{data.viewerSubmission.is_correct ? `Correct! +${data.viewerSubmission.points} points` : `Not this time — you guessed “${data.viewerSubmission.answer}”`}</div>}{data.role === "host" ? <button className="primary-button game-action" disabled={busy} onClick={() => hostAction("next")}>{round.number === EMOJI_ROUND_COUNT ? "See final scores →" : "Next signal →"}</button> : <div className="waiting-chip">Scoreboard updating…</div>}</>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <aside className="mini-scores"><p className="eyebrow">Scoreboard</p>{ranking.map((player, index) => <div className={connection === "live" && !onlinePlayerIds.includes(player.id) ? "offline" : ""} key={player.id}><span>{index + 1}</span><strong>{player.nickname}</strong><b>{player.score}</b></div>)}</aside>
    </section>
  </main>;
}
