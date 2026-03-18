import { supabase } from "@/lib/supabase/client";
import type { Me } from "@/app/issues/types";

export const getMe = async (): Promise<Me> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログインしてください");
  }

  const res = await fetch("http://localhost:8787/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "ユーザー情報の取得に失敗しました");
  }

  return data;
}