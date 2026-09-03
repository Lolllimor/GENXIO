import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PositionChart, { type ChartPoint } from "./results/PositionChart";

const ROSTER_STATUS_STYLE: Record<string, string> = {
  pending: "border-amber bg-amber/10 text-amber",
  accepted: "border-green bg-green/10 text-green",
  rejected: "border-red bg-red/10 text-red",
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [members, scrimCountRes, scrims, news, achievements, applications, matchResults, attendance] = await Promise.all([
    supabase.from("members").select("id, status"),
    supabase.from("scrims").select("id", { count: "exact", head: true }),
    supabase.from("scrims").select("*").order("scrim_date", { ascending: false }).limit(5),
    supabase.from("news_posts").select("id, published"),
    supabase.from("achievements").select("id, published"),
    supabase.from("applications").select("*").order("submitted_at", { ascending: false }),
    supabase.from("match_results").select("id, position, notes, scrims(scrim_date, opponent)"),
    supabase.from("scrim_attendance").select("scrim_id, status"),
  ]);

  const activeMembers = members.data?.filter((m) => m.status === "ACTIVE").length ?? 0;
  const totalMembers = members.data?.length ?? 0;
  const scrimCount = scrimCountRes.count ?? 0;
  const draftNews = news.data?.filter((n) => !n.published).length ?? 0;
  const draftAchievements = achievements.data?.filter((a) => !a.published).length ?? 0;

  const allApplications = applications.data ?? [];
  const pendingApplications = allApplications.filter((a) => a.roster_status === "pending").length;
  const recentApplications = allApplications.slice(0, 5);

  const recentScrims = scrims.data ?? [];
  const attendeeCounts: Record<string, number> = {};
  for (const row of attendance.data ?? []) {
    if (row.status === "present" || row.status === "late") {
      attendeeCounts[row.scrim_id] = (attendeeCounts[row.scrim_id] ?? 0) + 1;
    }
  }

  type RawResult = {
    id: string;
    position: number;
    notes: string | null;
    scrims: { scrim_date: string; opponent: string | null } | { scrim_date: string; opponent: string | null }[] | null;
  };
  const chartPoints: ChartPoint[] = ((matchResults.data as RawResult[]) ?? [])
    .map((r) => {
      const scrim = Array.isArray(r.scrims) ? r.scrims[0] : r.scrims;
      return { id: r.id, date: scrim?.scrim_date ?? "", position: r.position, label: scrim?.opponent ?? undefined };
    })
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  return (
    <div>
      <div className="eyebrow mb-2.5">Overview</div>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
        Dashboard
      </h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-stat">
          <div className="admin-stat-index">01 — Intake</div>
          <div className="font-display text-[32px] font-bold leading-none text-amber [text-shadow:0_0_18px_rgba(255,154,31,0.35)]">
            {pendingApplications}
          </div>
          <div className="mt-2.5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Applications pending</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-index">02 — Roster</div>
          <div className="font-display text-[32px] font-bold leading-none text-text">
            {activeMembers}
            <span className="ml-1.5 text-lg text-text-dim">/{totalMembers}</span>
          </div>
          <div className="mt-2.5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Active members</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-index">03 — Comp</div>
          <div className="font-display text-[32px] font-bold leading-none text-text">{scrimCount}</div>
          <div className="mt-2.5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Scrims logged</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-index">04 — Publish</div>
          <div className="font-display text-[32px] font-bold leading-none text-text">{draftNews + draftAchievements}</div>
          <div className="mt-2.5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Unpublished drafts</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="eyebrow">Performance trend</div>
          <Link href="/admin/results" className="text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
            View all →
          </Link>
        </div>
        <PositionChart points={chartPoints} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="eyebrow">Recent applications</div>
            <Link href="/admin/applications" className="text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
              View all →
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="admin-panel text-sm text-text-dim">No applications yet.</div>
          ) : (
            <div className="admin-panel !p-0">
              {recentApplications.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                    i < recentApplications.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-text">
                      {a.clan_tag} | {a.ign}
                    </div>
                    <div className="text-[11px] text-text-dim">
                      {new Date(a.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 border px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-wide ${
                      ROSTER_STATUS_STYLE[a.roster_status] ?? "border-line text-text-dim"
                    }`}
                  >
                    {a.roster_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="eyebrow">Recent scrims</div>
            <Link href="/admin/scrims" className="text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
              View all →
            </Link>
          </div>
          {recentScrims.length === 0 ? (
            <div className="admin-panel text-sm text-text-dim">No scrims logged yet.</div>
          ) : (
            <div className="admin-panel !p-0">
              {recentScrims.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/admin/scrims/${s.id}`}
                  className={`flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.02] ${
                    i < recentScrims.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-text">
                      {s.opponent || "Internal scrim"}
                    </div>
                    <div className="text-[11px] text-text-dim">
                      {new Date(s.scrim_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-text-dim">{attendeeCounts[s.id] ?? 0} attended</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
