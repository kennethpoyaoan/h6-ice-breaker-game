import { EMOJI_ROUND_COUNT, pickRandomPrompt } from "@/lib/game-content";
import { hashToken } from "@/lib/security";
import { broadcastRoomUpdate, createAdminClient } from "@/lib/supabase";
import { roomCodeSchema } from "@/lib/validation";
import { z } from "zod";

const actionSchema = z.object({ action: z.enum(["begin", "reveal", "next"]) });

export async function POST(request: Request, context: RouteContext<"/api/rooms/[code]/round">) {
  const { code: rawCode } = await context.params;
  const code = roomCodeSchema.safeParse(rawCode);
  const body = actionSchema.safeParse(await request.json().catch(() => null));
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!code.success || !body.success || !token) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data: room } = await supabase.from("rooms").select("id, host_token_hash").eq("code", code.data).maybeSingle();
    if (!room || room.host_token_hash !== hashToken(token)) return Response.json({ error: "Only the host can control rounds." }, { status: 403 });
    const { data: round } = await supabase.from("rounds").select("id, round_number, status").eq("room_id", room.id).order("round_number", { ascending: false }).limit(1).maybeSingle();
    if (!round) return Response.json({ error: "No active round." }, { status: 409 });

    if (body.data.action === "begin") {
      if (round.status !== "briefing") return Response.json({ error: "This round has already begun." }, { status: 409 });
      const { data: claimed, error } = await supabase.from("rounds").update({ status: "answering", ends_at: new Date(Date.now() + 45_000).toISOString() }).eq("id", round.id).eq("status", "briefing").select("id").maybeSingle();
      if (error) throw error;
      if (!claimed) return Response.json({ error: "This round has already begun." }, { status: 409 });
    } else if (body.data.action === "reveal") {
      if (round.status !== "answering") return Response.json({ error: "Answers are not open." }, { status: 409 });
      const { data: claimed, error: claimError } = await supabase.from("rounds").update({ status: "reveal", ends_at: null }).eq("id", round.id).eq("status", "answering").select("id").maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) return Response.json({ error: "This answer has already been revealed." }, { status: 409 });
      const { data: awards, error: awardsError } = await supabase.from("submissions").select("player_id, points").eq("round_id", round.id).gt("points", 0);
      if (awardsError) throw awardsError;
      for (const award of awards ?? []) {
        const { data: player } = await supabase.from("players").select("score").eq("id", award.player_id).single();
        const { error: scoreError } = await supabase.from("players").update({ score: (player?.score ?? 0) + award.points }).eq("id", award.player_id);
        if (scoreError) throw scoreError;
      }
    } else {
      if (round.status !== "reveal") return Response.json({ error: "Reveal this round first." }, { status: 409 });
      const nextNumber = round.round_number + 1;
      if (nextNumber > EMOJI_ROUND_COUNT) {
        await supabase.from("rooms").update({ status: "finished" }).eq("id", room.id);
      } else {
        const { data: previousRounds } = await supabase.from("rounds").select("prompt").eq("room_id", room.id);
        const prompt = pickRandomPrompt((previousRounds ?? []).map((item) => item.prompt));
        const { error } = await supabase.from("rounds").insert({ room_id: room.id, round_number: nextNumber, prompt: prompt.prompt, answer: prompt.answer, accepted_answers: prompt.accepted, status: "briefing" });
        if (error && error.code !== "23505") throw error;
      }
    }
    await broadcastRoomUpdate(room.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Round control failed", error);
    return Response.json({ error: "Could not update the round." }, { status: 500 });
  }
}
