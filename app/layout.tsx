import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/providers/UserProvider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مدرسة اليوسف للمتفوقين",
  description: "نظام إدارة المدرسة - مدرسة اليوسف للمتفوقين",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=4", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png?v=4", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png?v=4",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "اليوسف",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
