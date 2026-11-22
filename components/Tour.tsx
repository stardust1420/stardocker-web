"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SHOTS = [
  {
    key: "containers",
    label: "Containers",
    alt: "Containers screen: a Compose stack heading over three service cards with image, ports, CPU, memory and status, and a standalone container below",
    caption:
      "Every container as a card, Compose stacks grouped under a heading you fold with enter. ● running, ◐ paused or a partly running stack, ○ stopped. Each card shows the image, ports, live CPU and memory, and status.",
  },
  {
    key: "logs",
    label: "Logs",
    alt: "Logs screen following a container's output with timestamps, the container's running state in the header",
    caption:
      "The last hour (change it with t), then new lines stream in live. Filter with /, clear with c to watch only fresh output, save with o, or start, stop and shell into the container without leaving the view.",
  },
  {
    key: "inspect",
    label: "Inspect",
    alt: "Inspect screen with General, Ports, Networks, Mounts, Environment and Labels sections",
    caption: "Press i for everything Docker knows about a container: environment, ports, networks, mounts, labels and restart policy, laid out to read rather than as raw JSON.",
  },
  {
    key: "images",
    label: "Images",
    alt: "Images screen listing alpine:3.20 with its size, age and the four containers that use it",
    caption: "Sizes, age and exactly which containers use each image. p pulls (pre-filled with the selected image, so p enter updates it) and P prunes dangling layers.",
  },
  {
    key: "networks",
    label: "Networks",
    alt: "Networks screen showing bridge, host, none and a Compose network, each with its driver, subnet and the containers using it",
    caption: "See which containers are attached to what, and delete whatever nothing uses. Volumes work the same way.",
  },
];

export default function Tour() {
  const [active, setActive] = useState(0);
  const shot = SHOTS[active];

  // The tour is the whole page, so ← → and 1–5 switch screens from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("[role=tablist]")) return;
      if (e.key === "ArrowRight" || e.key === "l") setActive((i) => (i + 1) % SHOTS.length);
      else if (e.key === "ArrowLeft" || e.key === "h") setActive((i) => (i + SHOTS.length - 1) % SHOTS.length);
      else if (/^[1-5]$/.test(e.key)) setActive(Number(e.key) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Screens">
        {SHOTS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            id={`tab-${s.key}`}
            aria-selected={i === active}
            aria-controls="tour-panel"
            className="tab"
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const next = (i + (e.key === "ArrowRight" ? 1 : SHOTS.length - 1)) % SHOTS.length;
                setActive(next);
                document.getElementById(`tab-${SHOTS[next].key}`)?.focus();
              }
            }}
            tabIndex={i === active ? 0 : -1}
          >
            {s.label}
            <span className="n">{i + 1}</span>
          </button>
        ))}
      </div>
      <div id="tour-panel" role="tabpanel" aria-labelledby={`tab-${shot.key}`}>
        <div className="window">
          <div className="titlebar">
            <div className="lights" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="title">stardocker › {shot.label.toLowerCase()}</div>
          </div>
          <Image
            key={shot.key}
            src={`/screenshots/${shot.key}.png`}
            alt={shot.alt}
            width={2880}
            height={1800}
            sizes="(min-width: 1180px) 1116px, 100vw"
            className="tour-shot"
          />
        </div>
        <p className="tour-caption">{shot.caption}</p>
      </div>
    </div>
  );
}
