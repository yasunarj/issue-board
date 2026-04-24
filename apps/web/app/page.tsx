"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { apiFetch } from "./lib/api/client";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    const redirectByAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session?.access_token) {
        router.replace("login");
        return;
      }

      const res = await apiFetch("/me");

      if (!res.ok) {
        router.replace("/login");
        return;
      }

      router.replace("/issues");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>確認中...</p>
    </main>
  );
};

export default Home;