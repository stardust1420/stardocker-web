import type { Metadata } from "next";

export const metadata: Metadata = { title: "Keys" };

const KEYS: { title: string; rows: [string, string][] }[] = [
  {
    title: "Home",
    rows: [
      ["←/h  →/l  tab", "Move between cards"],
      ["enter  1–5", "Open a card"],
      ["q", "Quit"],
    ],
  },
  {
    title: "Every list",
    rows: [
      ["↑↓←→  hjkl", "Move between cards"],
      ["/", "Filter as you type"],
      ["d", "Delete the selected item (asks first)"],
      ["P", "Prune everything unused here"],
      ["esc", "Clear the filter, or go back"],
      ["?", "Show every key"],
      ["q", "Quit"],
    ],
  },
  {
    title: "Containers",
    rows: [
      ["enter", "Open logs, or fold a Compose stack"],
      ["s", "Start or stop (a whole stack, too)"],
      ["r", "Restart"],
      ["p", "Pause or unpause"],
      ["e", "Open a shell in the container"],
      ["i", "Inspect"],
      ["o / a", "Sort / running only"],
      ["P", "Delete all stopped containers"],
    ],
  },
  {
    title: "Logs",
    rows: [
      ["/", "Show only matching lines, highlighted"],
      ["t", "How many hours back (0.5 works)"],
      ["c / a", "Clear to see only new output / undo"],
      ["w", "Toggle line wrapping"],
      ["o", "Save the shown lines to a file"],
      ["s / e", "Start or stop / open a shell"],
      ["G", "Jump to the end"],
      ["esc", "Back to containers, place kept"],
    ],
  },
  {
    title: "Images",
    rows: [
      ["p", "Pull an image, with live progress"],
      ["o", "Sort by name, size or newest"],
      ["d", "Delete the image, or only the selected tag"],
      ["P", "Delete dangling images"],
    ],
  },
  {
    title: "Volumes & networks",
    rows: [
      ["d", "Delete one that nothing uses"],
      ["P", "Delete every unused one"],
      ["", "bridge, host and none can't be deleted"],
    ],
  },
];

export default function KeysPage() {
  return (
    <>
      <h1 className="section-title">One key per job. They mean the same thing on every screen.</h1>
      <p className="lede-left">
        Press <kbd className="k">?</kbd> on any list inside the app to see every key for that screen.
      </p>
      <div className="panels">
        {KEYS.map((k) => (
          <fieldset key={k.title} className="panel">
            <legend>{k.title}</legend>
            <table className="keys-table">
              <tbody>
                {k.rows.map(([key, what]) => (
                  <tr key={key + what}>
                    <td>{key}</td>
                    <td>{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </fieldset>
        ))}
      </div>
    </>
  );
}
