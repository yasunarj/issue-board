import type { ApiMeResponse, Me } from "@/app/issues/types";
import { apiFetch } from "./client";

export const mapMeResponse = (data: ApiMeResponse): Me => {
  return {
    id: data.userId,
    email: data.email,
    role: data.role,
    displayName: data.displayName,
  };
};

export const getMe = async (): Promise<Me> => {
  const res = await apiFetch("/me");

  const data = (await res.json()) as ApiMeResponse | { error?: string };

  if (!res.ok) {
    const errorMessage = "error" in data ? data.error : "ユーザーの取得に失敗しました"
    throw new Error(errorMessage);
  }

  return mapMeResponse(data as ApiMeResponse);
};
