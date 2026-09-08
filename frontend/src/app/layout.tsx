import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/layout/CartDrawer";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import PageTransition from "@/components/layout/PageTransition";
import AnnouncementModal from "@/components/common/AnnouncementModal";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Haus of Hafsah | Luxury Clothing & Accessories",
    template: "%s | Haus of Hafsah",
  },
  description: "Customer-facing boutique storefront for Haus of Hafsah premium clothing brand.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1 flex flex-col bg-background">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <Footer />
        <CartDrawer />
        <Toaster position="bottom-right" duration={1400} />
        <AnnouncementModal />
      </body>
    </html>
  );
}
