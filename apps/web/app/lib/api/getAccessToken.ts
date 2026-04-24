import { supabase } from "@/lib/supabase/client";

export const getAccessToken = async () => {
  const { data: sessionData } = await supabase.auth.getSession();

  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログインしてください");
  }

  return token;
}