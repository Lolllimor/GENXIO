"use client";

import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Achievement } from "@/lib/supabase/types";
import Modal from "../Modal";
import { toastSuccess, toastError } from "../toast";

const EMPTY_FORM = {
  result: "",
  title: "",
  description: "",
  achieved_on: new Date().toISOString().slice(0, 10),
  published: true,
};

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([]);
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
      .from("achievements")
      .select("*")
      .order("achieved_on", { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  function startEdit(a: Achievement) {
    setEditingId(a.id);
    setForm({
      result: a.result,
      title: a.title,
      description: a.description,
      achieved_on: a.achieved_on,
      published: a.published,
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
    if (!form.result.trim() || !form.title.trim()) return;
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      result: form.result.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      achieved_on: form.achieved_on,
      published: form.published,
      ...(editingId ? {} : { created_by: user?.id ?? null }),
    };

    const { error } = editingId
      ? await supabase.from("achievements").update(payload).eq("id", editingId)
      : await supabase.from("achievements").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
      return;
    }
    toastSuccess(editingId ? "Achievement updated." : "Achievement added.");
    resetForm();
    load();
  }

  async function togglePublished(a: Achievement) {
    const { error } = await supabase
      .from("achievements")
      .update({ published: !a.published })
      .eq("id", a.id);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess(a.published ? "Achievement unpublished." : "Achievement published.");
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this achievement?")) return;
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess("Achievement deleted.");
      load();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Track record</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Achievements
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary !py-2.5 !text-[11px]"
        >
          Log result
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <Modal open={showForm} onClose={resetForm} title={editingId ? "Edit achievement" : "New achievement"}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Result badge *</label>
              <input
                value={form.result}
                onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                placeholder="e.g. 1st Place, Top 4"
                required
              />
            </div>
            <div>
              <label>Date</label>
              <input
                type="date"
                value={form.achieved_on}
                onChange={(e) => setForm((f) => ({ ...f, achieved_on: e.target.value }))}
              />
            </div>
          </div>
          <div className="mb-3.5">
            <label>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Regional Qualifier"
              required
            />
          </div>
          <div className="mb-3.5">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="resize-y"
            />
          </div>
          <label className="mb-4 flex items-center gap-2 normal-case tracking-normal">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            <span className="text-xs text-text-dim">Published (visible on the public site)</span>
          </label>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : editingId ? "Save changes" : "Add achievement"}
          </button>
        </form>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-dim">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-dim">Nothing logged yet — add the first result above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="card">
              <div className="rank-badge mb-2.5">{a.result}</div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-text">{a.title}</h3>
              {a.description && (
                <p className="mb-3 text-xs leading-relaxed text-text-dim">{a.description}</p>
              )}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => togglePublished(a)}
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    a.published ? "text-green" : "text-text-dim"
                  }`}
                >
                  {a.published ? "Published" : "Draft"}
                </button>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(a)} className="text-[11px] font-semibold uppercase tracking-wide text-purple">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-[11px] font-semibold uppercase tracking-wide text-red">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
