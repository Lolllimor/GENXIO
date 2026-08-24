"use client";

import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MatchResult, Mode } from "@/lib/supabase/types";
import Modal from "../Modal";
import PositionChart from "./PositionChart";

const EMPTY_FORM = {
  match_date: new Date().toISOString().slice(0, 10),
  position: "",
  mode: "" as Mode | "",
  notes: "",
};

export default function MatchResultsPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("match_results")
      .select("*")
      .order("match_date", { ascending: false });
    if (error) setError(error.message);
    else setResults(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  function startEdit(r: MatchResult) {
    setEditingId(r.id);
    setForm({
      match_date: r.match_date,
      position: String(r.position),
      mode: r.mode ?? "",
      notes: r.notes ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const position = parseInt(form.position, 10);
    if (!form.match_date || !position || position < 1) return;
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      match_date: form.match_date,
      position,
      mode: form.mode || null,
      notes: form.notes.trim() || null,
      ...(editingId ? {} : { created_by: user?.id ?? null }),
    };

    const { error } = editingId
      ? await supabase.from("match_results").update(payload).eq("id", editingId)
      : await supabase.from("match_results").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this match result?")) return;
    const { error } = await supabase.from("match_results").delete().eq("id", id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Performance trend</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Match Results
          </h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary !py-2.5 !text-[11px]">
          Log a match
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-dim">Loading…</p>
      ) : (
        <PositionChart results={results} />
      )}

      <Modal open={showForm} onClose={resetForm} title={editingId ? "Edit match result" : "New match result"}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Date</label>
              <input
                type="date"
                value={form.match_date}
                onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label>Position *</label>
              <input
                type="number"
                min={1}
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                placeholder="e.g. 1"
                required
              />
            </div>
          </div>
          <div className="mb-3.5">
            <label>Mode</label>
            <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as Mode }))}>
              <option value="">—</option>
              <option value="MP">MP</option>
              <option value="BR">BR</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div className="mb-4">
            <label>Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Ranked push, ended vs Team Vortex"
            />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : editingId ? "Save changes" : "Add result"}
          </button>
        </form>
      </Modal>

      {!loading && results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-text-dim">
                <th className="py-2.5 pr-4 font-display">Date</th>
                <th className="py-2.5 pr-4 font-display">Position</th>
                <th className="py-2.5 pr-4 font-display">Mode</th>
                <th className="py-2.5 pr-4 font-display">Notes</th>
                <th className="py-2.5 pr-4 font-display"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-3 pr-4 text-text-dim">
                    {new Date(r.match_date + "T00:00:00").toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-text">#{r.position}</td>
                  <td className="py-3 pr-4 text-text-dim">{r.mode ?? "—"}</td>
                  <td className="py-3 pr-4 text-text-dim">{r.notes ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(r)} className="text-[11px] font-semibold uppercase tracking-wide text-purple hover:brightness-125">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-[11px] font-semibold uppercase tracking-wide text-red hover:brightness-125">
                        Delete
                      </button>
                    </div>
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
