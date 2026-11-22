export const REPO = "github.com/stardust1420/stardocker";
export const REPO_URL = `https://${REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
export const INSTALL_CMD = `go install ${REPO}@latest`;

// The same art the TUI draws on its home screen (src/index.go).
export const BANNER_ART = [
  "███████╗████████╗ █████╗ ██████╗ ██████╗  ██████╗  ██████╗██╗  ██╗███████╗██████╗ ",
  "██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗",
  "███████╗   ██║   ███████║██████╔╝██║  ██║██║   ██║██║     █████╔╝ █████╗  ██████╔╝",
  "╚════██║   ██║   ██╔══██║██╔══██╗██║  ██║██║   ██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗",
  "███████║   ██║   ██║  ██║██║  ██║██████╔╝╚██████╔╝╚██████╗██║  ██╗███████╗██║  ██║",
  "╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝",
].join("\n");

export const NAV = [
  { href: "/features", label: "features", title: "Features", desc: "What it does" },
  { href: "/tour", label: "tour", title: "Tour", desc: "Every screen" },
  { href: "/keys", label: "keys", title: "Keys", desc: "Every shortcut" },
  { href: "/install", label: "install", title: "Install", desc: "One command" },
] as const;

// Every page in order, the demo first: the sidebar, the pager and the
// ⇧1–⇧5 shortcuts all read this.
export const PAGES = [{ href: "/", label: "demo", title: "Demo", desc: "Drive it live" }, ...NAV] as const;

export function pageIndex(path: string) {
  return path === "/" ? 0 : PAGES.findIndex((p, i) => i > 0 && path.startsWith(p.href));
}
