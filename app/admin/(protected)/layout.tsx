import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 text-center">
        <div className="eyebrow mb-2.5 justify-center">Access denied</div>
        <h1 className="font-display text-2xl font-bold uppercase text-text">Not on the roster</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-text-dim">
          {user.email} is signed in but isn&apos;t in the <code className="text-text">admins</code>{" "}
          table. Add this account&apos;s UID there to grant access.
        </p>
        <a href="/admin/login" className="btn btn-outline mt-6">
          Back to login
        </a>
      </div>
    );
  }

  return <AdminShell email={adminRow.email}>{children}</AdminShell>;
}
