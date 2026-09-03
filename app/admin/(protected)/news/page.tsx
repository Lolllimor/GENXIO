"use client";

import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NewsPost } from "@/lib/supabase/types";
import Modal from "../Modal";
import { toastSuccess, toastError } from "../toast";

const EMPTY_FORM = {
  tag: "Announcement",
  title: "",
  body: "",
  post_date: new Date().toISOString().slice(0, 10),
  published: true,
};

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
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
      .from("news_posts")
      .select("*")
      .order("post_date", { ascending: false });
    if (error) setError(error.message);
    else setPosts(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  function startEdit(p: NewsPost) {
    setEditingId(p.id);
    setForm({
      tag: p.tag,
      title: p.title,
      body: p.body,
      post_date: p.post_date,
      published: p.published,
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
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      tag: form.tag.trim() || "Announcement",
      title: form.title.trim(),
      body: form.body.trim(),
      post_date: form.post_date,
      published: form.published,
      ...(editingId ? {} : { created_by: user?.id ?? null }),
    };

    const { error } = editingId
      ? await supabase.from("news_posts").update(payload).eq("id", editingId)
      : await supabase.from("news_posts").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
      return;
    }
    toastSuccess(editingId ? "Post updated." : "Post published.");
    resetForm();
    load();
  }

  async function togglePublished(p: NewsPost) {
    const { error } = await supabase
      .from("news_posts")
      .update({ published: !p.published })
      .eq("id", p.id);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess(p.published ? "Post unpublished." : "Post published.");
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("news_posts").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess("Post deleted.");
      load();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Clan updates</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            News
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary !py-2.5 !text-[11px]"
        >
          New post
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <Modal open={showForm} onClose={resetForm} title={editingId ? "Edit post" : "New post"}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Tag</label>
              <input value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="e.g. Roster" />
            </div>
            <div>
              <label>Date</label>
              <input
                type="date"
                value={form.post_date}
                onChange={(e) => setForm((f) => ({ ...f, post_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="mb-3.5">
            <label>Title *</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="mb-3.5">
            <label>Body *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              rows={4}
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Publish post"}
          </button>
        </form>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-dim">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-text-dim">No posts yet — write the first one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <div key={p.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="tag-chip mb-2">{p.tag}</span>
                  <h3 className="text-sm font-semibold text-text">{p.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-dim">{p.body}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => togglePublished(p)}
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      p.published ? "text-green" : "text-text-dim"
                    }`}
                  >
                    {p.published ? "Published" : "Draft"}
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(p)} className="text-[11px] font-semibold uppercase tracking-wide text-purple">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-[11px] font-semibold uppercase tracking-wide text-red">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
