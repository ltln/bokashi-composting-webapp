"use client";

import { getLoginCopy, type LoginErrorCode } from "@/content/auth";
import { useLocale } from "@/lib/i18n";

export function LoginError({ code }: { code?: string }) {
  const { locale } = useLocale();
  const errors = getLoginCopy(locale).errors;
  if (!code || !(code in errors)) return null;

  return (
    <p role="alert" className="m-0 rounded-bk-sm bg-bk-accent-tint px-4 py-3 text-sm text-bk-accent-dark">
      {errors[code as LoginErrorCode]}
    </p>
  );
}
