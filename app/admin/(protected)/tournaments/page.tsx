"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentKind } from "@/lib/supabase/types";
import Modal from "../Modal";
import RowMenu from "../RowMenu";
import { BulkBar, BulkButton, BulkConfirm, Check, useSelection } from "../bulk";
import { Segmented } from "../posters/controls";
import { toastError, toastSuccess } from "../toast";

type Size = "2" | "4";

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function TournamentsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Tournament[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [size, setSize] = useState<Size>("2");
  const [kind, setKind] = useState<TournamentKind>("inners");
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Tournament | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sel = useSelection(items.map((t) => t.id));
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, teamRes] = await Promise.all([
      supabase.from("tournaments").select("*").order("tournament_date", { ascending: false }),
      supabase.from("tournament_teams").select("tournament_id"),
    ]);
    if (tRes.error) setError(tRes.error.message);
    else setItems((tRes.data ?? []) as Tournament[]);
    const counts: Record<string, number> = {};
    for (const r of teamRes.data ?? []) counts[r.tournament_id as string] = (counts[r.tournament_id as string] ?? 0) + 1;
    setTeamCounts(counts);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("tournaments")
      .insert({ name: name.trim(), tournament_date: date, team_size: Number(size), kind, created_by: user?.id ?? null })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      toastError(/tournaments/i.test(error.message) ? "Run supabase/add_tournaments.sql in the Supabase SQL editor first." : error.message);
      return;
    }
    toastSuccess("Tournament created.");
    router.push(`/admin/tournaments/${data.id}`);
  }

  async function remove(ids: string[]) {
    setDeleting(true);
    const { error } = await supabase.from("tournaments").delete().in("id", ids);
    setDeleting(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
      return;
    }
    toastSuccess(ids.length === 1 ? "Tournament deleted." : `${ids.length} tournaments deleted.`);
    setToDelete(null);
    setBulkOpen(false);
    sel.clear();
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Competition</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">Tournaments</h1>
          <p className="mt-2 max-w-lg text-[13px] text-text-dim">Log team rankings and each player&apos;s kills for duo and squad tournaments.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary !py-2.5 !text-[11px]">
          New tournament
        </button>
      </div>

      {error && <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">{error}</div>}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New tournament">
        <form onSubmit={create}>
          <div className="mb-3.5">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Inners Tournament" required autoFocus />
          </div>
          <div className="mb-4 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label>Team size</label>
              <Segmented
                value={size}
                onChange={setSize}
                options={[
                  { id: "2", label: "Duo (2)" },
                  { id: "4", label: "Squad (4)" },
                ]}
              />
            </div>
          </div>
          <div className="mb-4">
            <label>Type</label>
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { id: "inners", label: "Inners" },
                { id: "other", label: "Other" },
              ]}
            />
            <p className="mt-1.5 text-[11px] text-text-dim">Only Inners tournaments count toward the leaderboards.</p>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Creating…" : "Create & add teams"}
          </button>
        </form>
      </Modal>

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Delete tournament?" accent="amber">
        {toDelete && (
          <div>
            <p className="text-sm text-text-dim">
              Delete <span className="font-semibold text-text">{toDelete.name}</span> with all its teams and player kills? This can&apos;t be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => remove([toDelete.id])} disabled={deleting} className="btn btn-primary flex-1 !bg-red !shadow-none">
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button type="button" onClick={() => setToDelete(null)} className="btn btn-outline flex-1">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {loading ? (
        <p className="text-sm text-text-dim">Loading tournaments…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-dim">No tournaments yet — create the first one.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="min-w-[640px]">
            <thead>
              <tr>
                <th className="w-10">
                  <Check checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} label="Select all tournaments" />
                </th>
                <th>Tournament</th>
                <th>Date</th>
                <th>Type</th>
                <th>Format</th>
                <th>Teams</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} data-selected={sel.has(t.id)} className="cursor-pointer" onClick={() => router.push(`/admin/tournaments/${t.id}`)}>
                  <td className="w-10" onClick={(e) => e.stopPropagation()}>
                    <Check checked={sel.has(t.id)} onChange={() => sel.toggle(t.id)} label={`Select ${t.name}`} />
                  </td>
                  <td className="font-semibold text-text">{t.name}</td>
                  <td className="text-text-dim">{fmtDate(t.tournament_date)}</td>
                  <td>
                    <span className={`border px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-wide ${t.kind === "other" ? "border-line text-text-dim" : "border-purple bg-purple/10 text-purple"}`}>
                      {t.kind === "other" ? "Other" : "Inners"}
                    </span>
                  </td>
                  <td className="text-text-dim">{t.team_size === 2 ? "Duo" : t.team_size === 4 ? "Squad" : `${t.team_size}-player`}</td>
                  <td className="text-text-dim">{teamCounts[t.id] ?? 0}</td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <RowMenu onView={() => router.push(`/admin/tournaments/${t.id}`)} onEdit={() => router.push(`/admin/tournaments/${t.id}`)} onDelete={() => setToDelete(t)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkBar count={sel.count} noun="tournament" onClear={sel.clear}>
        <BulkButton tone="danger" onClick={() => setBulkOpen(true)}>
          Delete
        </BulkButton>
      </BulkBar>
      <BulkConfirm
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Delete tournaments?"
        message={<>Delete <b className="text-text">{sel.count}</b> selected tournament{sel.count === 1 ? "" : "s"} with all teams and kills? This can&apos;t be undone.</>}
        confirmLabel={`Delete ${sel.count}`}
        busy={deleting}
        onConfirm={() => remove(sel.selected)}
      />
    </div>
  );
}
