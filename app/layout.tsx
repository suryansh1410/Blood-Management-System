import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "LifePulse | Blood Bank & Donation Management System",
  description:
    "A verified, real-time blood inventory and donation tracking platform connecting donors, healthcare facilities, and patients.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-rose-100 selection:text-rose-900">
        <Providers>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

