"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("メール形式が正しくありません"),
  password: z.string().min(6, "パスワードは6文字以上です"),
});

type Profile = { role: "admin" | "member" | "viewer" };

const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [me, setMe] = useState<{
    id: string;
    email: string | null;
    role: Profile["role"];
  } | null>(null);

  const init = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession();
  
    const token = session.session?.access_token;
    if (!token) {
      setMe(null);
      return null;
    }
  
    const res = await fetch("http://localhost:8787/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    if (!res.ok) {
      setMe(null);
      return null;
    }
  
    const data = await res.json();
  
    setMe({
      id: data.userId,
      email: data.email,
      role: data.role,
    });
  
    return data.role;
  }, []);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setMe(null);
      setMessage("ログアウトしました");
    } catch (e) {
      console.error(e);
      setMessage("ログアウトできませんでした");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-4 w-80">
        <h1>Issue Board</h1>
        <input
          type="email"
          className="border p-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            className="border p-2 flex-1"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="border px-4"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "非表示" : "表示"}
          </button>
        </div>
        {me ? (
          <button
            className="bg-black text-white p-2 border"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        ) : (
          <button
            className="bg-black text-white p-2 border"
            onClick={handleLogin}
          >
            {isLoading ? "ログイン中" : "ログイン"}
          </button>
        )}

        <p>{message}</p>
      </div>
    </main>
  );
};

export default Home;
