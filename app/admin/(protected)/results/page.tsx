"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import PositionChart, { type ChartPoint } from "./PositionChart";

interface ResultRow {
  id: string;
  scrim_id: string;
  lobby_number: number;
  position: number;
  notes: string | null;
  scrim_date: string;
  opponent: string | null;
}

export default function MatchResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("match_results")
      .select("id, scrim_id, lobby_number, position, notes, scrims(scrim_date, opponent)");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    type Raw = {
      id: string;
      scrim_id: string;
      lobby_number: number;
      position: number;
      notes: string | null;
      scrims: { scrim_date: string; opponent: string | null } | { scrim_date: string; opponent: string | null }[] | null;
    };

    const mapped: ResultRow[] = (data as Raw[] ?? []).map((r) => {
      const scrim = Array.isArray(r.scrims) ? r.scrims[0] : r.scrims;
      return {
        id: r.id,
        scrim_id: r.scrim_id,
        lobby_number: r.lobby_number,
        position: r.position,
        notes: r.notes,
        scrim_date: scrim?.scrim_date ?? "",
        opponent: scrim?.opponent ?? null,
      };
    });

    mapped.sort((a, b) => b.scrim_date.localeCompare(a.scrim_date) || a.lobby_number - b.lobby_number);
    setRows(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const chartPoints: ChartPoint[] = rows.map((r) => ({
    id: r.id,
    date: r.scrim_date,
    position: r.position,
    label: r.opponent ?? undefined,
  }));

  return (
    <div>
      <div className="mb-6">
        <div className="eyebrow mb-2.5">Performance trend</div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
          Match Results
        </h1>
        <p className="mt-2 max-w-lg text-[13px] text-text-dim">
          One row per lobby — log placements and kills from that scrim&apos;s attendance page.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      {loading ? <p className="text-sm text-text-dim">Loading…</p> : <PositionChart points={chartPoints} />}

      {!loading && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-text-dim">
                <th className="py-2.5 pr-4 font-display">Date</th>
                <th className="py-2.5 pr-4 font-display">Opponent</th>
                <th className="py-2.5 pr-4 font-display">Lobby</th>
                <th className="py-2.5 pr-4 font-display">Position</th>
                <th className="py-2.5 pr-4 font-display">Notes</th>
                <th className="py-2.5 pr-4 font-display"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-3 pr-4 text-text-dim">
                    {r.scrim_date
                      ? new Date(r.scrim_date + "T00:00:00").toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-text-dim">{r.opponent || "Internal scrim"}</td>
                  <td className="py-3 pr-4 text-text-dim">#{r.lobby_number}</td>
                  <td className="py-3 pr-4 font-semibold text-text">#{r.position}</td>
                  <td className="py-3 pr-4 text-text-dim">{r.notes ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/scrims/${r.scrim_id}`}
                      className="text-[11px] font-semibold uppercase tracking-wide text-purple hover:brightness-125"
                    >
                      Edit via scrim →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
