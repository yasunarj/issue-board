import { useState, useEffect, useCallback } from "react";
import { getMe } from "../lib/api/getMe";
import { Me } from "../issues/types";

const useMe = () => {
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await getMe();
      setMe(user)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("ユーザー情報の取得に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return { me, isLoading, error, refetchMe: fetchMe, isAdmin: me?.role === "admin" }
}

export { useMe };