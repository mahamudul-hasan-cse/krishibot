import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KrishiBot - AI Agriculture Assistant",
  description:
    "KrishiBot is an AI-powered agricultural assistant that helps farmers with crop disease detection, irrigation advice, fertilizer planning, and pest control — powered by a local LLM.",
  keywords: ["agriculture", "AI", "crop disease", "farming", "Bangladesh", "irrigation"],
};

// Runs before React hydrates so the dark class is already on <html>
// This prevents a flash of light content when the user prefers dark.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('krishibot_theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
    else if (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-primary-50 dark:bg-soil-900 text-gray-900 dark:text-soil-100 antialiased flex flex-col min-h-screen transition-colors">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
