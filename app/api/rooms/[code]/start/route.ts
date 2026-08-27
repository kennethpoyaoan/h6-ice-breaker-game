import { broadcastRoomUpdate, createAdminClient } from "@/lib/supabase";
import { hashToken } from "@/lib/security";
import { roomCodeSchema } from "@/lib/validation";
import { pickRandomPrompt } from "@/lib/game-content";

export async function POST(request: Request, context: RouteContext<"/api/rooms/[code]/start">) {
  const { code: rawCode } = await context.params;
  const code = roomCodeSchema.safeParse(rawCode);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!code.success || !token) return Response.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, host_token_hash, status")
      .eq("code", code.data)
      .maybeSingle();

    if (!room || room.host_token_hash !== hashToken(token)) {
      return Response.json({ error: "Only the host can start this game." }, { status: 403 });
    }
    if (room.status !== "lobby") return Response.json({ error: "This game has already started." }, { status: 409 });

    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);
    if ((count ?? 0) < 2) {
      return Response.json({ error: "Invite at least 2 players before starting." }, { status: 409 });
    }

    const firstPrompt = pickRandomPrompt();
    const { error: roundError } = await supabase.from("rounds").upsert({
      room_id: room.id,
      round_number: 1,
      prompt: firstPrompt.prompt,
      answer: firstPrompt.answer,
      accepted_answers: firstPrompt.accepted,
      status: "briefing",
    }, { onConflict: "room_id,round_number" });
    if (roundError) throw roundError;

    const { error } = await supabase.from("rooms").update({ status: "playing" }).eq("id", room.id);
    if (error) throw error;
    await broadcastRoomUpdate(room.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Start room failed", error);
    const databaseError = error as { code?: string; message?: string };
    const message = databaseError.code === "PGRST205"
      ? "Emoji Transmission is not installed yet. Run the latest Supabase migration, then try again."
      : databaseError.message?.includes("rounds")
        ? "The game database is missing its rounds table. Run the latest Supabase migration."
        : "Could not start the game.";
    return Response.json({ error: message }, { status: 500 });
  }
}
