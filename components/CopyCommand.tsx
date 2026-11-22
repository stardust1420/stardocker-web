"use client";

import { useState } from "react";

export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: the command is still selectable
    }
  };

  return (
    <div className="cmd">
      <code>
        <span className="c-run" aria-hidden="true">$ </span>
        {command}
      </code>
      <button type="button" onClick={copy} data-copied={copied} aria-label="Copy install command">
        {copied ? "✓ copied" : "copy"}
      </button>
    </div>
  );
}
