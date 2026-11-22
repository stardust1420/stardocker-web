import type { Metadata } from "next";
import Tour from "@/components/Tour";

export const metadata: Metadata = { title: "Tour" };

export default function TourPage() {
  return (
    <>
      <h1 className="section-title">What it looks like on your machine.</h1>
      <p className="lede-left">Real screenshots of every screen. ← → switch between them.</p>
      <Tour />
    </>
  );
}
