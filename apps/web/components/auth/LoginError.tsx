import { loginCopy, type LoginErrorCode } from "@/content/auth";

export function LoginError({ code }: { code?: string }) {
  if (!code || !(code in loginCopy.errors)) return null;
  return (
    <p role="alert" className="m-0 rounded-bk-sm bg-bk-accent-tint px-4 py-3 text-sm text-bk-accent-dark">
      {loginCopy.errors[code as LoginErrorCode]}
    </p>
  );
}
