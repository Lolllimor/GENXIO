"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";
import type { OrgSocialLink } from "@/lib/org-socials";

export default function SiteChrome({
  children,
  socials,
}: {
  children: React.ReactNode;
  socials: OrgSocialLink[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    document.documentElement.classList.toggle("is-admin", !!isAdmin);
    return () => document.documentElement.classList.remove("is-admin");
  }, [isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      {children}
      <Footer socials={socials} />
    </>
  );
}
