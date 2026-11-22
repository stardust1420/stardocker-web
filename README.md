# stardocker-web

Landing page for [StarDocker](https://github.com/stardust1420/stardocker), the keyboard-driven terminal UI for local Docker.

Next.js (App Router) + Tailwind v4, fully static. `/` is only the interactive terminal, sized to the window with no page scroll; `/features`, `/tour`, `/keys` and `/install` are separate pages under `app/(pages)` sharing a pager and footer. The header (`components/Topbar.tsx`) and starfield live in the root layout so they persist across navigation, and `app/template.tsx` gives each page its entrance. The look follows the TUI: its palette (`src/layout.go`), banner art, cards, breadcrumbs and starfield.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static production build
npm run lint
```

- `components/TerminalDemo.tsx`: the interactive pretend TUI (home, containers, logs, images, volumes, networks). Pure reducer over fake data; nothing talks to Docker.
- `components/Starfield.tsx`: canvas sky, still under `prefers-reduced-motion`.
- `components/Tour.tsx`: tabbed real screenshots from `public/screenshots` (copied from `stardocker/docs/screenshots`).
- `lib/site.ts`: repo URL, install command and banner art.
- `app/fonts`: self-hosted JetBrains Mono (full glyph set; Google's subsets lack the box-drawing glyphs the banner uses).
