import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";
import { getOrgSocialLinks } from "@/lib/org-socials";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Call of Duty Mobile Clan | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["GenXio", "GenXio Esports", "Call of Duty Mobile", "CODM clan", "CODM esports", "COD Mobile scrims", "esports clan recruiting", "CODM tournaments"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0d",
  colorScheme: "dark",
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const socials = await getOrgSocialLinks();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: "GenXio",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        description: SITE_DESCRIPTION,
        slogan: SITE_TAGLINE,
        sameAs: socials.map((s) => s.href),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };

  return (
    <html lang="en">
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
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
