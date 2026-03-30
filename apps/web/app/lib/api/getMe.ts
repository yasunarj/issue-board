import type { Me } from "@/app/issues/types";
import { apiFetch } from "./client";

export const getMe = async (): Promise<Me> => {
  const res = await apiFetch("/me");

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "ユーザー情報の取得に失敗しました");
  }

  return data;
};
