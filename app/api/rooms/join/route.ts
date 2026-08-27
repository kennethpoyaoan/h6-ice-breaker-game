import { broadcastRoomUpdate, createAdminClient } from "@/lib/supabase";
import { createToken, hashToken } from "@/lib/security";
import { joinRoomSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = joinRoomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check your room code and name." },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data: room } = await supabase
      .from("rooms")
      .select("id, code, status")
      .eq("code", parsed.data.code)
      .maybeSingle();

    if (!room) return Response.json({ error: "Room not found." }, { status: 404 });
    if (room.status !== "lobby") {
      return Response.json({ error: "This game has already started." }, { status: 409 });
    }

    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id);

    if ((count ?? 0) >= 20) return Response.json({ error: "This room is full." }, { status: 409 });

    const token = createToken();
    const { data: player, error } = await supabase
      .from("players")
      .insert({
        room_id: room.id,
        nickname: parsed.data.nickname,
        token_hash: hashToken(token),
      })
      .select("id")
      .single();

    if (error?.code === "23505") {
      return Response.json({ error: "That name is already taken in this room." }, { status: 409 });
    }
    if (error || !player) throw error;

    await broadcastRoomUpdate(room.id);
    return Response.json({ code: room.code, playerId: player.id, token, role: "player" }, { status: 201 });
  } catch (error) {
    console.error("Join room failed", error);
    return Response.json({ error: "Could not join the room. Please try again." }, { status: 500 });
  }
}
