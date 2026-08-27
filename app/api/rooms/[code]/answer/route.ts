import { isAcceptedAnswer } from "@/lib/game-content";
import { hashToken } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase";
import { roomCodeSchema } from "@/lib/validation";
import { z } from "zod";

const answerSchema = z.object({ answer: z.string().trim().min(1, "Enter a guess.").max(80) });

export async function POST(request: Request, context: RouteContext<"/api/rooms/[code]/answer">) {
  const { code: rawCode } = await context.params;
  const code = roomCodeSchema.safeParse(rawCode);
  const body = answerSchema.safeParse(await request.json().catch(() => null));
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!code.success || !body.success || !token) return Response.json({ error: body.success ? "Invalid request." : body.error.issues[0]?.message }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: room } = await supabase.from("rooms").select("id").eq("code", code.data).maybeSingle();
    if (!room) return Response.json({ error: "Room not found." }, { status: 404 });
    const { data: player } = await supabase.from("players").select("id").eq("room_id", room.id).eq("token_hash", hashToken(token)).maybeSingle();
    if (!player) return Response.json({ error: "Only players can submit guesses." }, { status: 403 });
    const { data: round } = await supabase.from("rounds").select("id, accepted_answers, status, ends_at").eq("room_id", room.id).order("round_number", { ascending: false }).limit(1).single();
    if (!round) return Response.json({ error: "No active round." }, { status: 409 });
    if (round.status !== "answering") return Response.json({ error: "Answers are closed." }, { status: 409 });
    if (round.ends_at && new Date(round.ends_at).getTime() < Date.now()) return Response.json({ error: "Time is up." }, { status: 409 });
    const correct = isAcceptedAnswer(body.data.answer, round.accepted_answers as string[]);
    const secondsLeft = Math.max(0, Math.ceil((new Date(round.ends_at).getTime() - Date.now()) / 1000));
    const points = correct ? 75 + secondsLeft * 5 : 0;
    const { error } = await supabase.from("submissions").insert({ round_id: round.id, player_id: player.id, answer: body.data.answer, is_correct: correct, points });
    if (error?.code === "23505") return Response.json({ error: "You already submitted a guess." }, { status: 409 });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Answer submission failed", error);
    return Response.json({ error: "Could not submit your guess." }, { status: 500 });
  }
}
