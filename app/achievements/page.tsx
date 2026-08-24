import ComingSoon from "../components/ComingSoon";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Achievement } from "@/lib/supabase/types";

export const revalidate = 60;

async function getAchievements(): Promise<Achievement[]> {
  if (!supabaseConfigured) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("published", true)
    .order("achieved_on", { ascending: false });
  return data ?? [];
}

export default async function AchievementsPage() {
  const achievements = await getAchievements();

  if (achievements.length === 0) {
    return (
      <ComingSoon
        eyebrow="Track record"
        title="Achievements & Tournaments"
        desc="Nothing on the board yet. Scrim results, ranked pushes, and tournament placements will be posted here once GenXio has runs to show."
      />
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pb-5 pt-14 md:px-8 md:pt-[60px]">
        <div className="eyebrow mb-2.5">Track record</div>
        <h1 className="font-display text-[28px] font-bold uppercase tracking-tight text-text md:text-[38px]">
          Achievements &amp; Tournaments
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] text-text-dim">
          Results GenXio has earned in scrims, ranked pushes, and tournament brackets.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div key={a.id} className="card">
              <div className="rank-badge mb-2.5">{a.result}</div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-text">{a.title}</h3>
              {a.description && (
                <p className="text-xs leading-relaxed text-text-dim">{a.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
