"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGES, pageIndex } from "@/lib/site";

// "← previous   next →" at the foot of each page, like the TUI's help bar.
export default function Pager() {
  const i = pageIndex(usePathname());
  if (i < 0) return null;
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];

  return (
    <nav className="pager" aria-label="Next and previous page">
      {prev ? (
        <Link href={prev.href}>
          <b>←</b> <span>{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href}>
          <span>{next.title}</span> <b>→</b>
        </Link>
      )}
    </nav>
  );
}
