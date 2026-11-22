// A template remounts on every navigation, so each page plays its own entrance
// while the header and the sky (in the layout) stay put.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
