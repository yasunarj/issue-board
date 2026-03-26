"use client";

import { useState } from "react";
import z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const RegisterSchema = z
  .object({
    email: z.email("正しいメール形式を入力してください"),
    password: z.string().min(6, "パスワードは6文字以上です"),
    passwordConfirm: z.string().min(6, "確認用のパスワードを入力してください"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    //refineは追加でバリデーションを設定するためのもの
    message: "パスワードが一致しません",
    path: ["passwordConfirm"], // pathはエラーが出た時にどこに表示をするのか、今回はpasswordConfirmに設定
  });

const RegisterPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    setIsLoading(true);
    setMessage(null);

    const result = RegisterSchema.safeParse({
      email,
      password,
      passwordConfirm,
    });

    if (!result.success) {
      setMessage({ text: result.error.issues[0].message, type: "error" });
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
        return;
      }

      setMessage({
        text: "登録が完了しました。確認メールが届いている場合はメールをご確認ください",
        type: "success",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "登録に失敗しました";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-4 w-80">
        <h1>新規登録</h1>
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
            value={password}
            placeholder="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="border px-4"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "非表示" : "表示"}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          className="border p-2"
          value={passwordConfirm}
          placeholder="password確認"
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        <button
          className="border p-2"
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? "登録中" : "登録する"}
        </button>
        <Link href="/" className="text-sm underline">
          ログインページへ
        </Link>
      </div>
    </main>
  );
};

export default RegisterPage;
