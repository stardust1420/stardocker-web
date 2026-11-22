import type { Metadata } from "next";
import CopyCommand from "@/components/CopyCommand";
import { INSTALL_CMD, RELEASES_URL, REPO_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Install" };

export default function InstallPage() {
  return (
    <>
      <h1 className="section-title">Three steps. No config, no background service.</h1>
      <div className="install-hero">
        <CopyCommand command={INSTALL_CMD} />
      </div>

      <div className="steps">
        <div className="step">
          <span className="num">1</span>
          <span className="what">Install with Go</span>
          <span className="detail">Needs Go 1.24 or newer. The binary lands in $(go env GOPATH)/bin.</span>
          <pre className="shell">
            <span className="p">$ </span>
            {INSTALL_CMD}
          </pre>
        </div>
        <div className="step">
          <span className="num">2</span>
          <span className="what">Make sure Go&apos;s bin directory is on your PATH</span>
          <span className="detail">Skip this if you&apos;ve installed Go tools before. Add the line to your ~/.zshrc or ~/.bashrc.</span>
          <pre className="shell">
            <span className="p">$ </span>
            {'export PATH="$PATH:$(go env GOPATH)/bin"'}
          </pre>
        </div>
        <div className="step">
          <span className="num">3</span>
          <span className="what">Run it</span>
          <span className="detail">
            It connects through DOCKER_HOST or the current docker context. Opening a shell (e) also needs the docker CLI on your PATH.
          </span>
          <pre className="shell">
            <span className="p">$ </span>stardocker{"            "}
            <span className="cm"># start the app</span>
            {"\n"}
            <span className="p">$ </span>stardocker --version{"  "}
            <span className="cm"># print the version</span>
            {"\n"}
            <span className="p">$ </span>stardocker --help{"     "}
            <span className="cm"># flags and environment variables</span>
          </pre>
        </div>
      </div>

      <div className="panels" style={{ marginTop: 44 }}>
        <fieldset className="panel">
          <legend>Works with</legend>
          <p className="c-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
            Any running Docker daemon:
          </p>
          <div className="daemons">
            {["Docker Desktop", "Colima", "OrbStack", "Rancher Desktop", "Docker Engine"].map((d) => (
              <span key={d}>
                <span className="c-run">●</span> {d}
              </span>
            ))}
          </div>
          <p className="c-muted" style={{ margin: "14px 0 4px", fontSize: 14 }}>
            Daemon down, Colima installed and DOCKER_HOST unset? StarDocker runs <span className="c-bright">colima start</span> and tries again.
          </p>
        </fieldset>
        <fieldset className="panel">
          <legend>No Go?</legend>
          <p className="c-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
            Prebuilt binaries for Linux, macOS and Windows (amd64 and arm64) are on the{" "}
            <a href={RELEASES_URL} className="c-accent">
              latest release
            </a>
            . Extract it and put <span className="c-bright">stardocker</span> on your PATH. Or build from source:
          </p>
          <pre className="shell" style={{ marginTop: 12 }}>
            <span className="p">$ </span>git clone {REPO_URL}.git{"\n"}
            <span className="p">$ </span>cd stardocker && go build .{"\n"}
            <span className="p">$ </span>./stardocker
          </pre>
        </fieldset>
      </div>
    </>
  );
}
