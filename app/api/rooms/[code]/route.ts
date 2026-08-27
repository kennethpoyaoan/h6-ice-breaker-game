import { createAdminClient } from "@/lib/supabase";
import { hashToken } from "@/lib/security";
import { roomCodeSchema } from "@/lib/validation";
import { getPromptClue } from "@/lib/game-content";

export async function GET(request: Request, context: RouteContext<"/api/rooms/[code]">) {
  const { code: rawCode } = await context.params;
  const code = roomCodeSchema.safeParse(rawCode);
  const token = new URL(request.url).searchParams.get("token");

  if (!code.success || !token) return Response.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, code, host_name, host_token_hash, status, created_at")
      .eq("code", code.data)
      .maybeSingle();

    if (!room) return Response.json({ error: "Room not found." }, { status: 404 });

    const tokenHash = hashToken(token);
    let role: "host" | "player" = "host";
    let viewerId: string | null = null;

    if (room.host_token_hash !== tokenHash) {
      const { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("room_id", room.id)
        .eq("token_hash", tokenHash)
        .maybeSingle();

      if (!player) return Response.json({ error: "Your room access has expired." }, { status: 401 });
      role = "player";
      viewerId = player.id;
    }

    const { data: players, error } = await supabase
      .from("players")
      .select("id, nickname, score, joined_at")
      .eq("room_id", room.id)
      .order("joined_at");
    if (error) throw error;

    const { data: round } = await supabase
      .from("rounds")
      .select("id, round_number, prompt, answer, status, ends_at")
      .eq("room_id", room.id)
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let submissionCount = 0;
    let viewerSubmission: { answer: string; is_correct: boolean; points: number } | null = null;
    if (round) {
      const { count } = await supabase.from("submissions").select("id", { count: "exact", head: true }).eq("round_id", round.id);
      submissionCount = count ?? 0;
      if (viewerId) {
        const { data: own } = await supabase.from("submissions").select("answer, is_correct, points").eq("round_id", round.id).eq("player_id", viewerId).maybeSingle();
        viewerSubmission = own;
      }
    }

    const clue = round ? getPromptClue(round.prompt) : null;

    return Response.json({
      serverNow: new Date().toISOString(),
      room: {
        id: room.id,
        code: room.code,
        hostName: room.host_name,
        status: room.status,
        createdAt: room.created_at,
      },
      players: players ?? [],
      role,
      viewerId,
      round: round ? {
        id: round.id,
        number: round.round_number,
        prompt: round.prompt,
        answer: round.status === "reveal" ? round.answer : null,
        status: round.status,
        endsAt: round.ends_at,
        submissionCount,
        category: clue?.category ?? "Everyday",
        pattern: clue?.pattern ?? "Mystery phrase",
      } : null,
      viewerSubmission,
    });
  } catch (error) {
    console.error("Load room failed", error);
    return Response.json({ error: "Could not load this room." }, { status: 500 });
  }
}
