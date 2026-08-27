import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local.",
    );
  }

  return { url, secret };
}

export function createAdminClient() {
  const { url, secret } = getSupabaseConfig();

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function broadcastRoomUpdate(roomId: string) {
  const supabase = createAdminClient();
  const channel = supabase.channel(`room:${roomId}`);

  try {
    await channel.httpSend("room_updated", { at: Date.now() });
  } finally {
    await supabase.removeChannel(channel);
  }
}
