import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-5">
      <div className="eyebrow mb-6 justify-center">GenXio — Restricted access</div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
