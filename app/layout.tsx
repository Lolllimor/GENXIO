import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";
import { getOrgSocialLinks } from "@/lib/org-socials";

export const metadata: Metadata = {
  title: "GenXio Esports — Play. Evolve. Dominate.",
  description:
    "GenXio is a competitive Call of Duty Mobile clan built on discipline, skill, and unity.",
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const socials = await getOrgSocialLinks();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="glow-field" />
        <div className="tactical-grid" />
        <div className="scan-sweep" />
        <div className="scanlines" />
        <div className="vignette" />
        <div className="grain" />
        <div className="relative z-10">
          <SiteChrome socials={socials}>{children}</SiteChrome>
        </div>
      </body>
    </html>
  );
}
