"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import Link from "next/link";
import { apiFetch } from "../lib/api/client";
import { mapMeResponse } from "../lib/api/getMe";
import type { ApiMeResponse, Me } from "../issues/types";
import LoadingButton from "../components/LoadingButton";

const loginSchema = z.object({
  email: z.email("メール形式が正しくありません"),
  password: z.string().min(6, "パスワードは6文字以上です"),
});

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [me, setMe] = useState<Me| null>(null);

  const init = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      setMe(null);
      return null;
    }

    const res = await apiFetch("/me");

    if (!res.ok) {
      setMe(null);
      return null;
    }

    const data: ApiMeResponse = await res.json();

    setMe(mapMeResponse(data));

    return data.role;
  }, []);

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const role = await init();
      if (role !== null) {
        router.replace("/issues")
      }
    }

    redirectIfLoggedIn();
  }, [router, init]);

  useEffect(() => {
    init();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      init();
    });

    return () => sub.subscription.unsubscribe();
  }, [init]);

  const handleLogin = async () => {
    setIsLoading(true);
    setMessage("");

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      setMessage(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const role = await init();
      setMessage(role ? `ログイン成功 (role: ${role})` : "ログイン成功");
      router.push("/issues");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setMe(null);
      setMessage("ログアウトしました");
    } catch (e) {
      console.error(e);
      setMessage("ログアウトできませんでした");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
      <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">社内 Issue 管理</p>
          <h1 className="mt-1 text-3xl font-bold">Issue Board</h1>
          <p className="mt-2 text-sm text-slate-500">
            アカウント情報を入力してログインしてください
          </p>
        </div>

        <div className="flex flex-col gap-4">
        <input
          type="email"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "非表示" : "表示"}
          </button>
        </div>
        {me ? (
          <LoadingButton
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            loadingText="ログアウト中..."
          >
            ログアウト
          </LoadingButton>
        ) : (
          <LoadingButton
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleLogin}
            isLoading={isLoading}
            loadingText="ログイン中..."
          >
            ログイン
          </LoadingButton>
        )}

        {message && (
          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </p>
        )}

        <Link
          href="/register"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          新規登録はこちら
        </Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;