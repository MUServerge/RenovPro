import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n/dictionaries";
import PwaSetup from "@/components/PwaSetup";

export const metadata: Metadata = {
  title: "MaysterPRO",
  description: "Multi-user work days & salary tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MaysterPRO",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F4E78",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const t = getDict(session?.locale ?? "en");

  return (
    <html lang={session?.locale ?? "en"}>
      <body className="font-sans antialiased">
        {children}
        <PwaSetup t={t} />
      </body>
    </html>
  );
}
