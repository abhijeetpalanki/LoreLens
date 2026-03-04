import type { Metadata } from "next";
import { ThemeProvider } from "@/app/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoreLens | Your Spoiler-Free Series Companion",
  description:
    "Explore the lore of your favorite universes without the fear of spoilers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-neutral-950 text-neutral-50 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
