"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export const useRequireAuth = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session?.access_token) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      setIsCheckingAuth(false);
    }
    checkAuth();
  }, [router, pathname]);

  return { isCheckingAuth };
}