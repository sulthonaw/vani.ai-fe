import type { Metadata } from "next";
import { plusJakartaSans, handwritingFont } from "@/libs/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vani.ai - Smart Hospital Platform",
  description: "Next Generation Healthcare Assistant & Hospital Management",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${handwritingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-plus-jakarta)] bg-background text-foreground">
        <TooltipProvider delay={150}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
