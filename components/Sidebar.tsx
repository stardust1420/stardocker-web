"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PAGES, REPO_URL, pageIndex } from "@/lib/site";

// The site's screens as a column of the TUI's home cards: grey border, thick
// orange border and orange title on the one you're on.
//
// Keys: ⇧1–⇧5 jump to a page from anywhere (plain digits and arrows belong to
// the demo and the tour). Once a card has focus, ↑/↓ or j/k move between cards.
export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const current = pageIndex(path);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      const n = /^Digit(\d)$/.exec(e.code)?.[1];
      const page = n ? PAGES[Number(n) - 1] : undefined;
      if (!page) return;
      e.preventDefault();
      router.push(page.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const onNavKey = (e: React.KeyboardEvent) => {
    const step = { ArrowDown: 1, j: 1, ArrowRight: 1, ArrowUp: -1, k: -1, ArrowLeft: -1 }[e.key];
    if (!step || e.metaKey || e.ctrlKey || e.altKey) return;
    const cards = [...(navRef.current?.querySelectorAll<HTMLElement>(".side-card") ?? [])];
    const at = cards.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    e.stopPropagation();
    cards[(at + step + cards.length) % cards.length].focus();
  };

  return (
    <aside className="sidebar">
      <Link href="/" className="side-brand c-accent b">
        ★ StarDocker
      </Link>
      <nav aria-label="Pages" className="side-nav" ref={navRef} onKeyDown={onNavKey}>
        {PAGES.map((n, i) => {
          const sel = current === i;
          return (
            <Link
              key={n.href}
              href={n.href}
              className="tcard side-card"
              data-sel={sel}
              aria-current={sel ? "page" : undefined}
              aria-keyshortcuts={`Shift+${i + 1}`}
            >
              <span className="t">
                <span className="name">{n.title}</span>
                <kbd className="side-key">⇧{i + 1}</kbd>
              </span>
              <span className="side-desc c-muted">{n.desc}</span>
            </Link>
          );
        })}
        <a href={REPO_URL} className="tcard side-card" target="_blank" rel="noopener noreferrer">
          <span className="t">
            <span className="name">GitHub</span>
            <span className="side-key">↗</span>
          </span>
          <span className="side-desc c-muted">Source, issues</span>
        </a>
      </nav>
      <p className="side-hint c-muted">
        <kbd>⇧</kbd> + <kbd>1</kbd>–<kbd>{PAGES.length}</kbd> to jump
      </p>
    </aside>
  );
}
