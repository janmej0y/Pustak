import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPustak Challenge",
  description: "A 1-hour full-stack hiring challenge built with FastAPI and Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
