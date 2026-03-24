import "./globals.scss";
import { Manrope, Cormorant_Garamond } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Trip AI",
  description: "AI powered travel platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cormorantGaramond.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}