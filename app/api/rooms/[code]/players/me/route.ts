import { hashToken } from "@/lib/security";
import { broadcastRoomUpdate, createAdminClient } from "@/lib/supabase";
import { roomCodeSchema } from "@/lib/validation";

export async function DELETE(request: Request, context: RouteContext<"/api/rooms/[code]/players/me">) {
  const { code: rawCode } = await context.params;
  const code = roomCodeSchema.safeParse(rawCode);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!code.success || !token) return Response.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const { data: room } = await supabase.from("rooms").select("id").eq("code", code.data).maybeSingle();
    if (!room) return Response.json({ error: "Room not found." }, { status: 404 });

    const { data: player, error } = await supabase
      .from("players")
      .delete()
      .eq("room_id", room.id)
      .eq("token_hash", hashToken(token))
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!player) return Response.json({ error: "Player not found." }, { status: 404 });

    await broadcastRoomUpdate(room.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Leave room failed", error);
    return Response.json({ error: "Could not leave the room." }, { status: 500 });
  }
}
