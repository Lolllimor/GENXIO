import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply to Join",
  description: "Apply to join GenXio, a competitive Call of Duty Mobile clan. Tell us your IGN, role, device and activity — we review activity, comms and in-game skill, not just rank.",
  alternates: { canonical: "/apply" },
  openGraph: { title: "Apply to Join GenXio Esports", description: "Request a slot on the GenXio Call of Duty Mobile roster.", url: "/apply" },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
