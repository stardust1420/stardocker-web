import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Starfield from "@/components/Starfield";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

// Self-hosted full JetBrains Mono: the Google subsets drop the box-drawing
// and block glyphs the banner is made of.
const mono = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StarDocker — your whole local Docker setup, one keystroke away",
    template: "%s · StarDocker",
  },
  description:
    "A fast, keyboard-driven terminal UI for Docker containers, Compose stacks, logs, images, volumes and networks. Install with go install.",
  openGraph: {
    title: "StarDocker",
    description: "A fast, keyboard-driven terminal UI for local Docker.",
    images: ["/screenshots/home.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#16171a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <Starfield />
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
