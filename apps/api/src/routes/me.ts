import "dotenv/config";
import { Hono } from "hono";
import { supabaseAdmin } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth";

type Variables = {
  user: User;
}

const me = new Hono<{ Variables: Variables }>();

me.use("*", authMiddleware);

me.get("/", async (c) => {
  const user = c.get("user");
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({
    userId: user.id,
    email: user.email,
    role: profile.role,
    displayName: profile.display_name,
  })
})

export default me;