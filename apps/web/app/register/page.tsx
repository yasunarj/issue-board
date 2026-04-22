"use client";

import { useState } from "react";
import z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import LoadingButton from "../components/LoadingButton";

const RegisterSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "表示名を入力してください")
      .max(20, "表示名は20文字以内です"),
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
  const [displayName, setDisplayName] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    setMessage(null);

    const result = RegisterSchema.safeParse({
      displayName,
      email,
      password,
      passwordConfirm,
    });

    if (!result.success) {
      setMessage({ text: result.error.issues[0].message, type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
        return;
      }

      setMessage({
        text: "登録が完了しました。確認メールが届いている場合はメールをご確認ください",
        type: "success",
      });

      router.push("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "登録に失敗しました";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
      <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">社内 Issue 管理</p>
          <h1 className="mt-1 text-3xl font-bold">新規登録</h1>
          <p className="mt-2 text-sm text-slate-500">
            利用するアカウント情報を登録してください
          </p>
        </div>

        <div className="flex flex-col gap-4">
        <input
          type="text"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="表示名"
          onFocus={() => setMessage(null)}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          type="email"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="email"
          value={email}
          onFocus={() => setMessage(null)}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={password}
            placeholder="password"
            onFocus={() => setMessage(null)}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "非表示" : "表示"}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={passwordConfirm}
          placeholder="password確認"
          onFocus={() => setMessage(null)}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        <LoadingButton
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleRegister}
          isLoading={isLoading}
          loadingText="登録中..."
        >
          登録する
        </LoadingButton>

        {message && (
          <p
            className={`rounded-md border px-3 py-2 text-sm ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </p>
        )}

        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ログインページへ
        </Link>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
