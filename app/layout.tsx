import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Visual Content Reviewer",
  description: "Get structured AI feedback on your images, banners, and visual content",
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
