import Link from "next/link";
import { loginCopy } from "@/content/auth";

export function LegalLine({ className }: { className: string }) {
  const l = loginCopy.legal;
  return (
    <p className={`m-0 text-bk-muted ${className}`}>
      {l.before}
      <Link href="/terms" className="underline">{l.terms}</Link>
      {l.between}
      <Link href="/privacy" className="underline">{l.privacy}</Link>
      {l.after}
    </p>
  );
}
