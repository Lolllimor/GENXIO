import type { Metadata } from "next";

// The admin console is private: keep every admin URL out of search results.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | GenXio Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
