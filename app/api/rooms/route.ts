import { createAdminClient } from "@/lib/supabase";
import { createRoomCode, createToken, hashToken } from "@/lib/security";
import { createRoomSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = createRoomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid host name." },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const hostToken = createToken();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createRoomCode();
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          code,
          host_name: parsed.data.hostName,
          host_token_hash: hashToken(hostToken),
        })
        .select("id, code")
        .single();

      if (!error && data) {
        return Response.json({ ...data, token: hostToken, role: "host" }, { status: 201 });
      }

      if (error?.code !== "23505") throw error;
    }

    return Response.json({ error: "Could not create a unique room. Try again." }, { status: 503 });
  } catch (error) {
    console.error("Create room failed", error);
    const message = error instanceof Error && error.message.startsWith("Supabase is not configured")
      ? error.message
      : "Room creation failed. Confirm the Supabase migration and environment variables.";
    return Response.json({ error: message }, { status: 500 });
  }
}
