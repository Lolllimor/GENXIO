"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Scrim } from "@/lib/supabase/types";
import Modal from "../Modal";

export default function ScrimsPage() {
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [opponent, setOpponent] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedScrim, setSelectedScrim] = useState<Scrim | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [editDate, setEditDate] = useState("");
  const [editOpponent, setEditOpponent] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [scrimsRes, attendanceRes, teamsRes] = await Promise.all([
      supabase.from("scrims").select("*").order("scrim_date", { ascending: false }),
      supabase.from("scrim_attendance").select("scrim_id, status"),
      supabase.from("scrim_teams").select("scrim_id"),
    ]);

    if (scrimsRes.error) setError(scrimsRes.error.message);
    else setScrims(scrimsRes.data ?? []);

    if (attendanceRes.data) {
      const counts: Record<string, number> = {};
      for (const row of attendanceRes.data) {
        if (row.status === "present" || row.status === "late") {
          counts[row.scrim_id] = (counts[row.scrim_id] ?? 0) + 1;
        }
      }
      setAttendeeCounts(counts);
    }

    if (teamsRes.data) {
      const counts: Record<string, number> = {};
      for (const row of teamsRes.data) {
        counts[row.scrim_id] = (counts[row.scrim_id] ?? 0) + 1;
      }
      setTeamCounts(counts);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("scrims").insert({
      scrim_date: date,
      opponent: opponent.trim() || null,
      notes: notes.trim() || null,
      created_by: user?.id ?? null,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpponent("");
    setNotes("");
    setShowForm(false);
    load();
  }

  function openDetail(s: Scrim) {
    setSelectedScrim(s);
    setDetailMode("view");
    setEditDate(s.scrim_date);
    setEditOpponent(s.opponent ?? "");
    setEditNotes(s.notes ?? "");
  }

  function closeDetail() {
    setSelectedScrim(null);
    setDetailMode("view");
  }

  async function handleDetailSave(e: FormEvent) {
    e.preventDefault();
    if (!selectedScrim) return;
    setDetailSaving(true);
    setError(null);

    const payload = {
      scrim_date: editDate,
      opponent: editOpponent.trim() || null,
      notes: editNotes.trim() || null,
    };

    const { error } = await supabase.from("scrims").update(payload).eq("id", selectedScrim.id);

    setDetailSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSelectedScrim({ ...selectedScrim, ...payload });
    setDetailMode("view");
    load();
  }

  async function handleDelete() {
    if (!selectedScrim) return;
    if (!confirm("Delete this scrim? Its attendance and team records will be deleted too.")) return;
    setDeleting(true);
    setError(null);

    const { error } = await supabase.from("scrims").delete().eq("id", selectedScrim.id);

    setDeleting(false);
    if (error) {
      setError(error.message);
      return;
    }
    closeDetail();
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Match log</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Scrims
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary !py-2.5 !text-[11px]"
        >
          Log a scrim
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New scrim">
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label>Opponent</label>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g. Team Vortex"
              />
            </div>
          </div>
          <div className="mb-4">
            <label>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Best of 5, SnD" />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Create scrim"}
          </button>
        </form>
      </Modal>

      <Modal
        open={selectedScrim !== null}
        onClose={closeDetail}
        title={detailMode === "edit" ? "Edit scrim" : "Scrim details"}
      >
        {selectedScrim && detailMode === "view" && (
          <div>
            <div className="font-display text-[13px] font-bold tracking-wide text-purple">
              {new Date(selectedScrim.scrim_date + "T00:00:00").toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="mt-1 text-base font-semibold text-text">
              {selectedScrim.opponent || "Internal scrim"}
            </div>
            {selectedScrim.notes && <p className="mt-2 text-sm text-text-dim">{selectedScrim.notes}</p>}

            <div className="mt-4 flex gap-4 border-t border-line pt-4 text-xs text-text-dim">
              <span>
                <span className="font-semibold text-text">{attendeeCounts[selectedScrim.id] ?? 0}</span> attended
              </span>
              <span>
                <span className="font-semibold text-text">{teamCounts[selectedScrim.id] ?? 0}</span> team(s)
              </span>
            </div>

            <Link
              href={`/admin/scrims/${selectedScrim.id}`}
              className="btn btn-outline mt-5 w-full !py-2.5 !text-[11px]"
            >
              Manage attendance →
            </Link>

            <div className="mt-3 flex gap-3">
              <button type="button" onClick={() => setDetailMode("edit")} className="btn btn-primary flex-1">
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-outline flex-1 !border-red !text-red hover:!shadow-none"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}

        {selectedScrim && detailMode === "edit" && (
          <form onSubmit={handleDetailSave}>
            <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
              <div>
                <label>Date</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </div>
              <div>
                <label>Opponent</label>
                <input value={editOpponent} onChange={(e) => setEditOpponent(e.target.value)} />
              </div>
            </div>
            <div className="mb-4">
              <label>Notes</label>
              <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={detailSaving} className="btn btn-primary flex-1">
                {detailSaving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setDetailMode("view")} className="btn btn-outline flex-1">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {loading ? (
        <p className="text-sm text-text-dim">Loading scrims…</p>
      ) : scrims.length === 0 ? (
        <p className="text-sm text-text-dim">No scrims logged yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {scrims.map((s) => (
            <button
              key={s.id}
              onClick={() => openDetail(s)}
              className="card flex items-center justify-between gap-4 text-left"
            >
              <div>
                <div className="font-display text-[13px] font-bold tracking-wide text-purple">
                  {new Date(s.scrim_date + "T00:00:00").toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="mt-1 text-sm font-semibold text-text">
                  {s.opponent || "Internal scrim"}
                </div>
                {s.notes && <p className="mt-1 text-xs text-text-dim">{s.notes}</p>}
                <div className="mt-2 flex gap-3 text-[11px] text-text-dim">
                  <span>{attendeeCounts[s.id] ?? 0} attended</span>
                  <span>{teamCounts[s.id] ?? 0} team(s)</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-dim">
                Details →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
