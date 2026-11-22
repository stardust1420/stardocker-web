import Pager from "@/components/Pager";
import { REPO, REPO_URL } from "@/lib/site";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page subpage">
      {children}
      <Pager />
      <footer className="footer">
        <div className="row">
          <a href={REPO_URL} className="c-muted" target="_blank" rel="noopener noreferrer">
            {REPO}
          </a>
          <div className="c-muted">MIT licensed · made with ☕ and Go</div>
        </div>
      </footer>
    </main>
  );
}
