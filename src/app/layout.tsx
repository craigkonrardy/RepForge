import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepForge — Training",
  description: "Private workout programming and training logs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}