import Pager from "@/components/Pager";
import TerminalDemo from "@/components/TerminalDemo";

export default function Home() {
  return (
    <main className="stage">
      <h1 className="sr-only">StarDocker: a keyboard-driven terminal UI for local Docker</h1>
      <TerminalDemo />
      <Pager />
    </main>
  );
}
