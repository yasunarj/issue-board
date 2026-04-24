import { getAccessToken } from "./getAccessToken";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URLが設定されていません");
}

const normalizePath = (path: string) => {
  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
};

const joinUrl = (baseUrl: string, path: string) => {
  return `${baseUrl.replace(/\/+$/, "")}${normalizePath(path)}`;
};

type ApiFetchOptions = {
  withAuth?: boolean;
};

export const apiFetch = async (
  path: string,
  init?: RequestInit,
  options: ApiFetchOptions = {},
) => {
  // withAuth未設定ならtrue (認証あり)
  const { withAuth = true } = options;
  // 呼び出し側のheadersを引き継ぐ
  const headers = new Headers(init?.headers);

  if (withAuth) {
    const token = await getAccessToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(joinUrl(apiBaseUrl, path), {
    ...init,
    headers,
  });
};
