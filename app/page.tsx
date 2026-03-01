"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("メール形式が正しくありません"),
  password: z.string().min(6, "パスワードは6文字以上です"),
});

const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("ログイン成功");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-4 w-80">
        <h1>Issue Board</h1>
        <input
          type="text
      "
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
        <button
          className="bg-black text-white p-2 border"
          onClick={handleLogin}
        >
          {isLoading ? "ログイン中" : "ログイン"}
        </button>

        <p>{message}</p>
      </div>
    </main>
  );
};

export default Home;
