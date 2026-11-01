import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/authContext";
import NanoBotFloating from "@/components/chatbot/NanoBotFloating";

export const metadata: Metadata = {
  title: "NanoVision | AI-Powered Nanoparticle Metrology Platform",
  description: "Automated nanoparticle size analysis, scale calibration, and statistical characterization from SEM and TEM micrographs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        <AuthProvider>
          {children}
          <NanoBotFloating />
        </AuthProvider>
      </body>
    </html>
  );
}

