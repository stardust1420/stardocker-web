import type { Metadata } from "next";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  { name: "Live CPU & memory", body: "Every running container, refreshed every second and summed for Compose stacks. Sort by CPU or memory with o." },
  { name: "Compose-aware", body: "Services are grouped under their project. Fold a stack, or start, stop and restart it as one." },
  { name: "Logs that keep up", body: "Streams new lines as they're written, filters and highlights as you type, survives restarts, saves to a file." },
  { name: "Shell in with e", body: "Drops you into bash (or sh) inside the container, and back into the app when you exit." },
  { name: "Inspect", body: "Environment, ports, networks, mounts, labels and restart policy, laid out to read instead of raw JSON." },
  {
    name: "Clean up safely",
    body: "Delete or prune containers, images, volumes and networks. Every destructive action asks first; anything in use is protected.",
  },
  { name: "Filter & sort everywhere", body: "/ on any list filters as you type. o sorts by CPU, memory, size or age." },
  {
    name: "Any daemon",
    body: "Docker Desktop, Colima, OrbStack, Rancher Desktop or plain Engine. If Colima is installed and stopped, StarDocker starts it for you.",
  },
  { name: "A home with a sky", body: "Parallax stars, twinkles and the occasional shooting star. Keep them still with STARDOCKER_REDUCED_MOTION=1." },
];

export default function FeaturesPage() {
  return (
    <>
      <h1 className="section-title">Everything docker can tell you, on one screen, without touching the mouse.</h1>
      <p className="lede-left">
        Stop juggling <span className="c-bright">docker ps</span>, <span className="c-bright">logs -f</span>, <span className="c-bright">exec -it</span> and{" "}
        <span className="c-bright">compose</span> across five tabs.
      </p>
      <div className="features">
        {FEATURES.map((f, i) => (
          <article key={f.name} className="feature">
            <h2>
              <span className="name">{f.name}</span>
              <span className="n">{i + 1}</span>
            </h2>
            <p>{f.body}</p>
          </article>
        ))}
      </div>
    </>
  );
}
