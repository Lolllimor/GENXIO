"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HISTORY_EVENTS, historyMissingTable } from "@/lib/history";
import type { HistoryEventType, MemberHistory } from "@/lib/supabase/types";
import Timeline from "./Timeline";

type EventFilter = HistoryEventType | "all";

function HistoryInner() {
  const searchParams = useSearchParams();
  const memberFromUrl = searchParams.get("member");

  const [events, setEvents] = useState<MemberHistory[]>([]);
  const [members, setMembers] = useState<{ id: string; ign: string; clan_tag: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [memberFilter, setMemberFilter] = useState(memberFromUrl ?? "");
  const [query, setQuery] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [historyRes, membersRes] = await Promise.all([
      supabase.from("member_history").select("*").order("created_at", { ascending: false }),
      supabase.from("members").select("id, ign, clan_tag").order("ign"),
    ]);
    if (historyRes.error) setError(historyMissingTable(historyRes.error.message));
    else {
      setError(null);
      setEvents(historyRes.data ?? []);
    }
    if (membersRes.data) setMembers(membersRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    if (memberFromUrl) setMemberFilter(memberFromUrl);
  }, [memberFromUrl]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (eventFilter !== "all" && e.event_type !== eventFilter) return false;
      if (memberFilter && e.member_id !== memberFilter) return false;
      if (q && !e.ign.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, eventFilter, memberFilter, query]);

  const selectedMember = members.find((m) => m.id === memberFilter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Roster</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Timeline
          </h1>
          <p className="mt-1.5 text-xs text-text-dim">
            History of who was added, promoted, or demoted.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["all", ...HISTORY_EVENTS.map((e) => e.id)] as const).map((id) => {
          const label = id === "all" ? "All" : HISTORY_EVENTS.find((e) => e.id === id)?.label;
          const count = id === "all" ? events.length : events.filter((e) => e.event_type === id).length;
          return (
            <button
              key={id}
              onClick={() => setEventFilter(id)}
              className={`border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)] ${
                eventFilter === id ? "border-purple bg-purple/10 text-purple" : "border-line text-text-dim"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div>
          <label>Search IGN</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name…"
          />
        </div>
        <div>
          <label>Member</label>
          <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.clan_tag} | {m.ign}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMember && (
        <p className="mb-4 text-xs text-text-dim">
          Showing history for <span className="font-semibold text-text">{selectedMember.ign}</span>
          {" · "}
          <button type="button" onClick={() => setMemberFilter("")} className="text-purple">
            Clear
          </button>
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-dim">Loading timeline…</p>
      ) : (
        <Timeline events={visible} />
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-dim">Loading timeline…</p>}>
      <HistoryInner />
    </Suspense>
  );
}
