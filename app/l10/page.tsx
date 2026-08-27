import type { Metadata } from "next";
import { L10Presentation } from "./presentation";
import "./presentation.css";

export const metadata: Metadata = {
  title: "High6 — L10",
  description: "High6 mission, vision, purpose, values, and promise.",
  robots: { index: false, follow: false },
};

export default function L10Page() {
  return <L10Presentation />;
}
