import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "GenXio Esports — Play. Evolve. Dominate.",
  description:
    "GenXio is a competitive Call of Duty Mobile clan built on discipline, skill, and unity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="tactical-grid" />
        <div className="scanlines" />
        <div className="vignette" />
        <div className="relative z-10">
          <Nav />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
