import type { Metadata } from "next";
import "./globals.css";
import "./game.css";
import "./dark.css";

export const metadata: Metadata = {
  title: "Signal Scramble — Meeting games for your crew",
  description: "Fast, creative mini-games for remote teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
