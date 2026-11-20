import type { Metadata, Viewport } from "next";
import { plusJakartaSans, handwritingFont } from "@/libs/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "vani.ai — Every abnormal result gets an owner";
const DESCRIPTION =
  "vani.ai follows each abnormal screening result until care is done. Vani reminds patients and family on WhatsApp, asks why a visit was missed, helps with the barrier, and hands over to staff when a person is needed.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · vani.ai",
  },
  description: DESCRIPTION,
  applicationName: "vani.ai",
  keywords: [
    "screening follow-up",
    "closing the loop",
    "care coordination",
    "hypertension",
    "WhatsApp health assistant",
    "patient navigation",
    "Future Health Challenge",
  ],
  authors: [{ name: "vani.ai team" }],
  creator: "vani.ai",
  category: "health",
  openGraph: {
    type: "website",
    siteName: "vani.ai",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#081832",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
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
