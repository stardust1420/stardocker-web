"use client";

import { useEffect, useReducer, useRef, useSyncExternalStore, type ReactNode } from "react";
import { BANNER_ART } from "@/lib/site";

/* A pretend StarDocker you can drive with the keyboard. Same screens, keys,
   glyphs and colours as the TUI; the Docker daemon is a few objects below. */

type Screen = "home" | "containers" | "logs" | "images" | "volumes" | "networks" | "exit";
type Kind = "nginx" | "node" | "postgres" | "redis" | "alpine";
type CState = "running" | "exited" | "paused";

type Ctr = {
  id: string;
  name: string;
  image: string;
  ports: string;
  stack?: string;
  state: CState;
  changed: number; // sim second of the last state change
  exit: number;
  cpu: number;
  mem: number; // KiB
  base: { cpu: number; mem: number };
  kind: Kind;
};

type Line = { id: number; ts: string; text: string };
type Status = { text: string; tone: "ok" | "info" | "warn"; until: number };

type State = {
  screen: Screen;
  homeSel: number;
  ctrs: Ctr[];
  now: number;
  expanded: boolean;
  cSel: string;
  logId: string;
  lines: Line[];
  lineSeq: number;
  tickN: number;
  listSel: number;
  status: Status | null;
};

const STACK = "shop";
const STACK_KEY = `stack:${STACK}`;

function ctr(
  id: string,
  image: string,
  kind: Kind,
  ports: string,
  state: CState,
  changed: number,
  cpu: number,
  mem: number,
  stack?: string,
  exit = 0,
): Ctr {
  const on = state !== "exited";
  return {
    id,
    name: id,
    image,
    kind,
    ports,
    stack,
    state,
    changed,
    exit,
    cpu: on ? cpu : 0,
    mem: on ? mem : 0,
    base: { cpu, mem },
  };
}

const INITIAL_CTRS: Ctr[] = [
  ctr("shop-api-1", "node:22-alpine", "node", "3000→3000/tcp", "running", -7900, 2.1, 88_000, STACK),
  ctr("shop-cache-1", "redis:7-alpine", "redis", "6379/tcp", "exited", -1500, 0.3, 7_400, STACK),
  ctr("shop-db-1", "postgres:16-alpine", "postgres", "5432/tcp", "running", -7930, 0.4, 41_000, STACK),
  ctr("shop-web-1", "nginx:1.27-alpine", "nginx", "8080→80/tcp", "running", -7920, 0.1, 9_600, STACK),
  ctr("stardocker-test", "alpine:3.20", "alpine", "", "running", -48, 0.2, 496),
  ctr("migrate-once", "node:22-alpine", "node", "", "exited", -86_400 * 3, 1.2, 60_000, undefined, 1),
];

const IMAGES = [
  { ref: "nginx:1.27-alpine", size: 47.9, age: "3 weeks ago", used: ["shop-web-1"] },
  { ref: "node:22-alpine", size: 157, age: "2 weeks ago", used: ["shop-api-1", "migrate-once"] },
  { ref: "postgres:16-alpine", size: 276, age: "5 weeks ago", used: ["shop-db-1"] },
  { ref: "redis:7-alpine", size: 41.2, age: "1 month ago", used: ["shop-cache-1"] },
  { ref: "alpine:3.20", size: 7.8, age: "4 months ago", used: ["stardocker-test"] },
  { ref: "<none>:<none>", size: 157, age: "2 months ago", used: [] },
];
const IMAGES_MB = IMAGES.reduce((a, i) => a + i.size, 0);

const VOLUMES = [
  { name: "shop_pgdata", driver: "local", age: "2 days ago", used: ["shop-db-1"] },
  { name: "shop_redis", driver: "local", age: "2 days ago", used: ["shop-cache-1"] },
];

const NETWORKS = [
  { name: "bridge", driver: "bridge", subnet: "172.17.0.0/16", used: ["stardocker-test", "migrate-once"] },
  { name: "host", driver: "host", subnet: "", used: [] },
  { name: "none", driver: "null", subnet: "", used: [] },
  { name: "shop_default", driver: "bridge", subnet: "172.18.0.0/16", used: ["shop-api-1", "shop-cache-1", "shop-db-1", "shop-web-1"] },
];

const HOME_CARDS: { title: string; desc: string; screen: Screen }[] = [
  { title: "Containers", desc: "Run, stop, read logs", screen: "containers" },
  { title: "Images", desc: "Pull, prune, sizes", screen: "images" },
  { title: "Volumes", desc: "Data that persists", screen: "volumes" },
  { title: "Networks", desc: "How containers talk", screen: "networks" },
  { title: "Exit", desc: "Close StarDocker", screen: "exit" },
];

const initialState: State = {
  screen: "home",
  homeSel: 0,
  ctrs: INITIAL_CTRS,
  now: 0,
  expanded: true,
  cSel: "shop-web-1",
  logId: "",
  lines: [],
  lineSeq: 0,
  tickN: 0,
  listSel: 0,
  status: null,
};

/* ── formatting ───────────────────────────────────────────── */

function dur(s: number) {
  s = Math.max(1, Math.round(s));
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  if (s < 120) return "About a minute";
  if (s < 3600) return `${Math.floor(s / 60)} minutes`;
  if (s < 7200) return "About an hour";
  if (s < 172_800) return `${Math.floor(s / 3600)} hours`;
  return `${Math.floor(s / 86_400)} days`;
}

function mem(kib: number) {
  if (kib < 1024) return `${Math.round(kib)}KiB`;
  if (kib < 1024 * 1024) return `${(kib / 1024).toFixed(1)}MiB`;
  return `${(kib / 1024 / 1024).toFixed(2)}GiB`;
}

function mb(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(2)}GB` : `${n.toFixed(n < 100 ? 1 : 0)}MB`;
}

function statusText(c: Ctr, now: number) {
  const d = dur(now - c.changed);
  if (c.state === "running") return `Up ${d}`;
  if (c.state === "paused") return `Up ${d} (Paused)`;
  return `Exited (${c.exit}) ${d} ago`;
}

function stamp(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const rnd = (n: number) => Math.floor(Math.random() * n);

function logText(kind: Kind, n: number) {
  const paths = ["/", "/products", "/products/42", "/cart", "/api/health", "/static/app.js"];
  switch (kind) {
    case "alpine":
      return `tick ${n}`;
    case "nginx":
      return `172.18.0.1 - - "${pick(["GET", "GET", "GET", "POST"])} ${pick(paths)} HTTP/1.1" ${pick([200, 200, 200, 304, 404])} ${200 + rnd(4000)} "-" "Mozilla/5.0"`;
    case "node":
      return `[api] ${pick(["GET", "GET", "POST", "PUT"])} ${pick(paths)} ${pick([200, 200, 201, 204, 404])} ${3 + rnd(60)}ms`;
    case "postgres":
      return pick([
        "LOG:  checkpoint starting: time",
        `LOG:  checkpoint complete: wrote ${1 + rnd(40)} buffers (0.${rnd(9)}%); 0 WAL file(s) added`,
        `LOG:  duration: 0.${100 + rnd(800)} ms  statement: SELECT * FROM products WHERE id = ${1 + rnd(400)}`,
        `LOG:  connection received: host=172.18.0.${3 + rnd(3)} port=${40000 + rnd(9999)}`,
      ]);
    case "redis":
      return pick([
        "* 1 changes in 3600 seconds. Saving...",
        `* Background saving started by pid ${20 + rnd(30)}`,
        "* DB saved on disk",
        "* Background saving terminated with success",
      ]);
  }
}

function startLine(kind: Kind) {
  switch (kind) {
    case "nginx":
      return "/docker-entrypoint.sh: Configuration complete; ready for start up";
    case "node":
      return "[api] listening on :3000";
    case "postgres":
      return "LOG:  database system is ready to accept connections";
    case "redis":
      return "* Ready to accept connections tcp";
    case "alpine":
      return "tick 1";
  }
}

/* ── state ────────────────────────────────────────────────── */

type Action = { type: "tick"; wall: number } | { type: "key"; key: string; wall: number; cols: number } | { type: "click"; target: string; wall: number; cols: number };

function chunk<T>(a: T[], n: number) {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}

function stackChildren(s: State) {
  return s.ctrs.filter((c) => c.stack === STACK);
}

function containerRows(s: State, cols: number) {
  const kids = s.expanded ? stackChildren(s).map((c) => c.id) : [];
  const solo = s.ctrs.filter((c) => !c.stack).map((c) => c.id);
  return [[STACK_KEY], ...chunk(kids, cols), ...chunk(solo, cols)];
}

function moveInRows(rows: string[][], sel: string, key: string) {
  const flat = rows.flat();
  let r = rows.findIndex((row) => row.includes(sel));
  if (r < 0) return flat[0];
  let c = rows[r].indexOf(sel);
  const i = flat.indexOf(sel);
  switch (key) {
    case "left":
      return flat[Math.max(0, i - 1)];
    case "right":
      return flat[Math.min(flat.length - 1, i + 1)];
    case "up":
      r = Math.max(0, r - 1);
      break;
    case "down":
      r = Math.min(rows.length - 1, r + 1);
      break;
    case "first":
      return flat[0];
    case "last":
      return flat[flat.length - 1];
    default:
      return sel;
  }
  c = Math.min(c, rows[r].length - 1);
  return rows[r][c];
}

function setStatus(s: State, text: string, tone: Status["tone"] = "ok"): State {
  return { ...s, status: { text, tone, until: s.now + 4 } };
}

function withCtr(s: State, id: string, f: (c: Ctr) => Ctr): State {
  return { ...s, ctrs: s.ctrs.map((c) => (c.id === id ? f(c) : c)) };
}

function start(c: Ctr, now: number): Ctr {
  return { ...c, state: "running", changed: now, cpu: c.base.cpu, mem: c.base.mem };
}

function stop(c: Ctr, now: number): Ctr {
  return { ...c, state: "exited", changed: now, exit: c.kind === "alpine" ? 137 : 0, cpu: 0, mem: 0 };
}

function openLogs(s: State, id: string, wall: number): State {
  const c = s.ctrs.find((x) => x.id === id)!;
  const lines: Line[] = [];
  let seq = s.lineSeq;
  const count = c.state === "exited" && c.kind === "alpine" ? 0 : 16;
  for (let i = 0; i < count; i++) {
    seq++;
    lines.push({ id: seq, ts: stamp(wall - (count - i) * 7000), text: logText(c.kind, i + 1) });
  }
  if (c.state === "exited") {
    seq++;
    lines.push({ id: seq, ts: stamp(wall - 1500_000), text: c.exit ? "Error: relation \"orders\" already exists" : "shutting down" });
  }
  return { ...s, screen: "logs", logId: id, lines, lineSeq: seq, tickN: count };
}

function toggleCtr(s: State, id: string, wall: number): State {
  const c = s.ctrs.find((x) => x.id === id)!;
  if (c.state === "exited") {
    let next = withCtr(s, id, (x) => start(x, s.now));
    if (s.screen === "logs") {
      next = { ...next, lineSeq: next.lineSeq + 1, tickN: 1, lines: [...next.lines, { id: next.lineSeq + 1, ts: stamp(wall), text: startLine(c.kind) }] };
    }
    return setStatus(next, `Started ${c.name}`);
  }
  return setStatus(withCtr(s, id, (x) => stop(x, s.now)), `Stopped ${c.name}`);
}

const DEMO_ONLY = "Just a demo: install StarDocker to do that for real";

function listLength(screen: Screen) {
  return screen === "images" ? IMAGES.length : screen === "volumes" ? VOLUMES.length : NETWORKS.length;
}

function reducer(s: State, a: Action): State {
  if (a.type === "tick") {
    const now = s.now + 1;
    const ctrs = s.ctrs.map((c) =>
      c.state === "running"
        ? { ...c, cpu: c.base.cpu * (0.55 + Math.random() * 0.9), mem: c.base.mem * (0.97 + Math.random() * 0.06) }
        : c,
    );
    let next: State = { ...s, now, ctrs, status: s.status && s.status.until <= now ? null : s.status };
    if (s.screen === "logs") {
      const c = ctrs.find((x) => x.id === s.logId);
      if (c && c.state === "running" && (c.kind === "alpine" ? now % 2 === 0 : Math.random() < 0.7)) {
        const n = s.tickN + 1;
        const lines = [...s.lines, { id: s.lineSeq + 1, ts: stamp(a.wall), text: logText(c.kind, n) }].slice(-300);
        next = { ...next, lines, lineSeq: s.lineSeq + 1, tickN: n };
      }
    }
    return next;
  }

  if (a.type === "click") {
    if (s.screen === "home") {
      const i = Number(a.target);
      return i === s.homeSel ? reducer(s, { type: "key", key: "enter", wall: a.wall, cols: a.cols }) : { ...s, homeSel: i };
    }
    if (s.screen === "containers") {
      return a.target === s.cSel ? reducer(s, { type: "key", key: "enter", wall: a.wall, cols: a.cols }) : { ...s, cSel: a.target };
    }
    if (s.screen === "images" || s.screen === "volumes" || s.screen === "networks") {
      return { ...s, listSel: Number(a.target) };
    }
    if (s.screen === "exit") return { ...s, screen: "home", homeSel: 0 };
    return s;
  }

  const { key, wall, cols } = a;

  if (key === "q" && s.screen !== "exit") return { ...s, screen: "exit", status: null };

  switch (s.screen) {
    case "home": {
      const n = HOME_CARDS.length;
      if (key === "left" || key === "up") return { ...s, homeSel: (s.homeSel + n - 1) % n };
      if (key === "right" || key === "down") return { ...s, homeSel: (s.homeSel + 1) % n };
      let pickIdx = -1;
      if (key === "enter" || key === "space") pickIdx = s.homeSel;
      if (/^[1-5]$/.test(key)) pickIdx = Number(key) - 1;
      if (pickIdx < 0) return s;
      const screen = HOME_CARDS[pickIdx].screen;
      return { ...s, homeSel: pickIdx, screen, listSel: 0, status: null };
    }

    case "containers": {
      const rows = containerRows(s, cols);
      if (["left", "right", "up", "down", "first", "last"].includes(key)) {
        return { ...s, cSel: moveInRows(rows, s.cSel, key) };
      }
      const onStack = s.cSel === STACK_KEY;
      const kids = stackChildren(s);
      switch (key) {
        case "esc":
          return { ...s, screen: "home", homeSel: 0, status: null };
        case "enter":
          if (onStack) return { ...s, expanded: !s.expanded };
          return openLogs({ ...s, status: null }, s.cSel, wall);
        case "s": {
          if (onStack) {
            const anyUp = kids.some((c) => c.state !== "exited");
            const ctrs = s.ctrs.map((c) => (c.stack !== STACK ? c : anyUp ? (c.state === "exited" ? c : stop(c, s.now)) : start(c, s.now)));
            return setStatus({ ...s, ctrs }, anyUp ? `Stopped ${STACK} (${kids.filter((c) => c.state !== "exited").length} services)` : `Started ${STACK} (${kids.length} services)`);
          }
          return toggleCtr(s, s.cSel, wall);
        }
        case "r": {
          const targets = onStack ? kids.filter((c) => c.state !== "paused") : s.ctrs.filter((c) => c.id === s.cSel);
          const ids = new Set(targets.map((c) => c.id));
          const ctrs = s.ctrs.map((c) => (ids.has(c.id) ? start(c, s.now) : c));
          return setStatus({ ...s, ctrs }, `Restarted ${onStack ? STACK : targets[0].name}`);
        }
        case "p": {
          if (onStack) return setStatus(s, "Pause works on a single container", "info");
          const c = s.ctrs.find((x) => x.id === s.cSel)!;
          if (c.state === "exited") return setStatus(s, `${c.name} isn't running`, "warn");
          const paused = c.state === "paused";
          return setStatus(withCtr(s, c.id, (x) => ({ ...x, state: paused ? "running" : "paused", cpu: paused ? x.base.cpu : 0 })), `${paused ? "Unpaused" : "Paused"} ${c.name}`);
        }
        case "e":
          return setStatus(s, onStack ? "Pick a container to open a shell" : `docker exec -it ${s.cSel} sh`, "info");
        case "i":
        case "/":
        case "o":
        case "a":
        case "d":
        case "P":
          return setStatus(s, DEMO_ONLY, "info");
        default:
          return s;
      }
    }

    case "logs": {
      switch (key) {
        case "esc":
          return { ...s, screen: "containers", status: null };
        case "s":
          return toggleCtr(s, s.logId, wall);
        case "c":
          return setStatus({ ...s, lines: [] }, "Cleared: only new lines from here", "info");
        case "/":
        case "t":
        case "w":
        case "o":
        case "e":
          return setStatus(s, DEMO_ONLY, "info");
        default:
          return s;
      }
    }

    case "images":
    case "volumes":
    case "networks": {
      const n = listLength(s.screen);
      const ids = Array.from({ length: n }, (_, i) => String(i));
      if (["left", "right", "up", "down", "first", "last"].includes(key)) {
        return { ...s, listSel: Number(moveInRows(chunk(ids, cols), String(s.listSel), key)) };
      }
      if (key === "esc") {
        return { ...s, screen: "home", homeSel: HOME_CARDS.findIndex((c) => c.screen === s.screen), status: null };
      }
      if (["d", "P", "p", "/", "o"].includes(key)) return setStatus(s, DEMO_ONLY, "info");
      return s;
    }

    case "exit":
      if (key === "enter") return { ...s, screen: "home", homeSel: 0, status: null };
      return s;
  }
}

/* ── keys ─────────────────────────────────────────────────── */

const KEYMAP: Record<string, string> = {
  ArrowLeft: "left",
  h: "left",
  ArrowRight: "right",
  l: "right",
  ArrowUp: "up",
  k: "up",
  ArrowDown: "down",
  j: "down",
  Enter: "enter",
  " ": "space",
  Escape: "esc",
  Home: "first",
  g: "first",
  End: "last",
  G: "last",
};

function normalize(e: React.KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  // ⇧1–⇧9 belong to the site's page shortcuts, not the pretend terminal.
  if (e.shiftKey && e.code.startsWith("Digit")) return null;
  if (KEYMAP[e.key]) return KEYMAP[e.key];
  if (e.key.length === 1) return e.key;
  return null;
}

// Read the clock outside render so the key handlers stay pure to the compiler.
const wallClock = () => Date.now();

const wideQuery = "(min-width: 768px)";
function subscribeWide(cb: () => void) {
  const m = window.matchMedia(wideQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/* ── view pieces ──────────────────────────────────────────── */

function Glyph({ state }: { state: CState | "partial" }) {
  if (state === "running") return <span className="c-run">●</span>;
  if (state === "paused" || state === "partial") return <span className="c-accent">◐</span>;
  return <span className="c-muted">○</span>;
}

function Crumbs({ path, right }: { path: string[]; right?: ReactNode }) {
  return (
    <div className="crumbs">
      <div>
        <span className="c-accent b">★ StarDocker</span>
        {path.map((p, i) => (
          <span key={p}>
            <span className="c-muted"> › </span>
            <span className={i === path.length - 1 ? "c-bright b" : "c-muted"}>{p}</span>
          </span>
        ))}
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}

function HelpBar({ keys, status }: { keys: [string, string][]; status: Status | null }) {
  return (
    <div className="helpbar">
      <div className="keys">
        {keys.map(([k, v]) => (
          <div key={k}>
            <b>{k}</b> <span>{v}</span>
          </div>
        ))}
      </div>
      {status && <div className={status.tone === "ok" ? "c-run" : status.tone === "warn" ? "c-danger" : "c-accent"}>{status.text}</div>}
    </div>
  );
}

function Stat({ cpu, kib }: { cpu: number; kib: number }) {
  return (
    <>
      {cpu.toFixed(1)}% <span className="c-muted">CPU</span>
      {"   "}
      {mem(kib)} <span className="c-muted">memory</span>
    </>
  );
}

/* ── the component ────────────────────────────────────────── */

export default function TerminalDemo() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(wideQuery).matches,
    () => true,
  );
  const cols = wide ? 3 : 1;
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // The home page is just this terminal, so it takes the keys straight away.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "tick", wall: wallClock() }), 1000);
    return () => clearInterval(t);
  }, []);

  // Logs follow the end, like the viewport in the TUI.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [s.lines, s.screen]);

  // Keep the selected card in view inside the pretend terminal.
  useEffect(() => {
    rootRef.current?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: "nearest" });
  }, [s.cSel, s.listSel, s.screen, s.expanded]);

  const press = (key: string) => dispatch({ type: "key", key, wall: wallClock(), cols });
  const click = (target: string) => {
    rootRef.current?.focus({ preventScroll: true });
    dispatch({ type: "click", target, wall: wallClock(), cols });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const key = normalize(e);
    if (!key) return;
    e.preventDefault();
    press(key);
  };

  const running = s.ctrs.filter((c) => c.state !== "exited").length;
  const stopped = s.ctrs.length - running;
  const kids = stackChildren(s);
  const kidsUp = kids.filter((c) => c.state !== "exited");

  let screen: ReactNode;

  if (s.screen === "home") {
    screen = (
      <div className="demo-scroll">
        <div className="home">
          <div className="home-inner">
            <div className="banner" aria-hidden="true">
              <pre>{BANNER_ART}</pre>
            </div>
            <div className="home-cards">
              {HOME_CARDS.map((card, i) => {
                const sel = s.homeSel === i;
                return (
                  <div key={card.title} className="tcard" data-sel={sel} data-danger={card.screen === "exit"} onClick={() => click(String(i))}>
                    <div className="t">
                      <span className="name">{card.title}</span>
                      <span className="c-muted" style={{ fontWeight: 400 }}>
                        {i + 1}
                      </span>
                    </div>
                    <div className="body">
                      <div className="c-muted">{card.desc}</div>
                      {i === 0 && (
                        <div>
                          <span className="c-run">●</span> <span className="c-bright">{running}</span> <span className="c-muted">of {s.ctrs.length} running</span>
                        </div>
                      )}
                      {i === 1 && (
                        <div>
                          <span className="c-bright b">{mb(IMAGES_MB)}</span> <span className="c-muted">in {IMAGES.length} images</span>
                        </div>
                      )}
                      {i === 2 && (
                        <div>
                          <span className="c-bright b">{VOLUMES.length}</span> <span className="c-muted">volumes</span>
                        </div>
                      )}
                      {i === 3 && (
                        <div>
                          <span className="c-bright b">{NETWORKS.length}</span> <span className="c-muted">networks</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="home-foot">
              <div>Connected to unix:///var/run/docker.sock</div>
              <div>
                <b className="c-bright">←/h</b> previous{"   "}
                <b className="c-bright">→/l</b> next{"   "}
                <b className="c-bright">enter</b> open{"   "}
                <b className="c-bright">q</b> quit
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (s.screen === "containers") {
    const stackCpu = kids.reduce((a, c) => a + c.cpu, 0);
    const stackMem = kids.reduce((a, c) => a + c.mem, 0);
    const card = (c: Ctr) => {
      const sel = s.cSel === c.id;
      return (
        <div key={c.id} className="tcard" data-sel={sel} onClick={() => click(c.id)}>
          <div className="t">
            <span>
              <Glyph state={c.state} /> <span className="name">{c.name}</span>
            </span>
          </div>
          <div className="body" style={{ paddingLeft: "2ch" }}>
            <div>{c.image}</div>
            <div>{c.ports || <span className="c-muted">No published ports</span>}</div>
            {c.state !== "exited" && (
              <div>
                <Stat cpu={c.cpu} kib={c.mem} />
              </div>
            )}
            <div className="c-muted">{statusText(c, s.now)}</div>
          </div>
        </div>
      );
    };
    const stackState = kidsUp.length === 0 ? "exited" : kidsUp.length === kids.length ? "running" : "partial";
    screen = (
      <>
        <Crumbs
          path={["Containers"]}
          right={
            <>
              <span>
                <span className="c-run">●</span> <span className="c-bright b">{running}</span> <span className="c-muted">running</span>
              </span>
              <span className="c-muted">
                ○ <span className="c-bright b">{stopped}</span> stopped
              </span>
            </>
          }
        />
        <div className="demo-scroll">
          <div className="stackrow" data-sel={s.cSel === STACK_KEY} onClick={() => click(STACK_KEY)}>
            <span>
              <Glyph state={stackState} /> <span className="c-muted">{s.expanded ? "▾" : "▸"}</span> <span className="c-bright b">{STACK}</span>
            </span>
            <span>
              {kidsUp.length} <span className="c-muted">of {kids.length} running</span>
            </span>
            <span>
              <Stat cpu={stackCpu} kib={stackMem} />
            </span>
          </div>
          {s.expanded && <div className="grid3">{kids.map(card)}</div>}
          <div className="plainhead">Standalone</div>
          <div className="grid3">{s.ctrs.filter((c) => !c.stack).map(card)}</div>
        </div>
        <HelpBar
          keys={[
            ["enter", s.cSel === STACK_KEY ? "fold stack" : "logs"],
            ["s", "start/stop"],
            ["r", "restart"],
            ["p", "pause"],
            ["e", "shell"],
            ["esc", "back"],
          ]}
          status={s.status}
        />
      </>
    );
  } else if (s.screen === "logs") {
    const c = s.ctrs.find((x) => x.id === s.logId)!;
    screen = (
      <>
        <Crumbs
          path={["Containers", c.name]}
          right={
            <span>
              <Glyph state={c.state} /> <span className="c-muted">{statusText(c, s.now)}</span>
            </span>
          }
        />
        <div className="demo-scroll" ref={logRef} style={{ padding: "0 4px" }}>
          {s.lines.length === 0 && <div className="c-muted">{c.state === "exited" ? "No output in the last hour." : "Waiting for new output…"}</div>}
          {s.lines.map((l) => (
            <div key={l.id} className="logline">
              <span className="ts">{l.ts}</span> {l.text}
            </div>
          ))}
        </div>
        <HelpBar
          keys={[
            ["/", "filter"],
            ["t", "range"],
            ["c", "clear"],
            ["w", "wrap"],
            ["s", c.state === "exited" ? "start" : "stop"],
            ["esc", "back"],
          ]}
          status={s.status}
        />
      </>
    );
  } else if (s.screen === "images" || s.screen === "volumes" || s.screen === "networks") {
    type Item = { title: ReactNode; lines: ReactNode[] };
    const used = (u: string[]) =>
      u.length === 0 ? <span className="c-muted">Not used</span> : u.length === 1 ? <>used by {u[0]}</> : <>used by {u.length} containers</>;
    let items: Item[];
    let crumb: string;
    let right: ReactNode;
    if (s.screen === "images") {
      crumb = "Images";
      right = (
        <span>
          <span className="c-bright b">{IMAGES.length}</span> <span className="c-muted">images</span> <span className="c-bright b">{mb(IMAGES_MB)}</span>
        </span>
      );
      items = IMAGES.map((i) => ({
        title: <span className={i.used.length ? "name" : "name c-muted"}>{i.ref}</span>,
        lines: [
          <>
            {mb(i.size)} <span className="c-muted">· {i.age}</span>
          </>,
          used(i.used),
        ],
      }));
    } else if (s.screen === "volumes") {
      crumb = "Volumes";
      right = (
        <span>
          <span className="c-bright b">{VOLUMES.length}</span> <span className="c-muted">volumes</span>
        </span>
      );
      items = VOLUMES.map((v) => ({
        title: <span className="name">{v.name}</span>,
        lines: [<span key="d" className="c-muted">{v.driver} driver · {v.age}</span>, used(v.used)],
      }));
    } else {
      crumb = "Networks";
      right = (
        <span>
          <span className="c-bright b">{NETWORKS.length}</span> <span className="c-muted">networks</span>
        </span>
      );
      items = NETWORKS.map((n) => ({
        title: <span className="name">{n.name}</span>,
        lines: [
          <>
            {n.driver}
            {n.subnet && <span className="c-muted"> · {n.subnet}</span>}
          </>,
          used(n.used),
        ],
      }));
    }
    screen = (
      <>
        <Crumbs path={[crumb]} right={right} />
        <div className="demo-scroll">
          <div className="grid3">
            {items.map((it, i) => {
              const sel = s.listSel === i;
              return (
                <div key={i} className="tcard" data-sel={sel} onClick={() => click(String(i))}>
                  <div className="t">{it.title}</div>
                  <div className="body">
                    {it.lines.map((l, j) => (
                      <div key={j}>{l}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <HelpBar
          keys={[
            ...(s.screen === "images" ? ([["p", "pull"]] as [string, string][]) : []),
            ["d", "delete"],
            ["P", "prune"],
            ["/", "filter"],
            ["esc", "back"],
          ]}
          status={s.status}
        />
      </>
    );
  } else {
    screen = (
      <div className="demo-scroll" onClick={() => click("relaunch")} style={{ padding: "0 4px" }}>
        <div>
          <span className="c-run">~</span> <span className="c-accent">❯</span> stardocker
        </div>
        <div>
          <span className="c-run">~</span> <span className="c-accent">❯</span> <span className="cursor" />
        </div>
        <div className="c-muted" style={{ marginTop: "1.55em" }}>
          # press <b className="c-bright">enter</b> to run stardocker again
        </div>
      </div>
    );
  }

  return (
    <div className="demo-wrap">
      <div className="window fill">
        <div className="titlebar">
          <div className="lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="title">~ — stardocker</div>
        </div>
        <div
          ref={rootRef}
          className="demo"
          tabIndex={0}
          role="application"
          aria-label="Interactive StarDocker demo. Use arrow keys, enter, escape, s, r and q."
          onKeyDown={onKeyDown}
        >
          <div className="demo-screen">{screen}</div>
          <div className="demo-hint">click to focus · then use the keys</div>
        </div>
      </div>
      <div className="touchkeys" aria-label="On-screen keys">
        {(
          [
            ["←", "left"],
            ["↑", "up"],
            ["↓", "down"],
            ["→", "right"],
            ["enter", "enter"],
            ["esc", "esc"],
            ["s", "s"],
            ["r", "r"],
          ] as const
        ).map(([label, key]) => (
          <button key={key} type="button" onClick={() => press(key)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
