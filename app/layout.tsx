import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { Logo } from "@/app/components/logo";
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
      <body
        className="bg-neutral-950 text-neutral-50 antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ClerkProvider appearance={{ baseTheme: dark }}>
            <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Logo />
                <nav className="flex gap-4">
                  <Show when="signed-out">
                    <SignInButton />
                    <SignUpButton>
                      <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <UserButton />
                  </Show>
                </nav>
              </div>
            </header>
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
