import { Plus_Jakarta_Sans, Caveat } from "next/font/google";

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const handwritingFont = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
