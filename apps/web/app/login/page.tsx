"use client";

import { Suspense } from "react";
import LoginContent from "./LoginContent";

const LoginPage = () => {
  return (
    <Suspense fallback="読み込み中...">
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
