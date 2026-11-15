"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLAN_TEAMS } from "@/lib/gameData";
import type { Application, ClanTeam, RosterStatus } from "@/lib/supabase/types";
import { toastSuccess, toastError } from "../toast";
import { BulkBar, BulkButton, BulkConfirm, Check, useSelection } from "../bulk";

const STATUS_STYLE: Record<RosterStatus, string> = {
  pending: "border-amber bg-amber/10 text-amber",
  accepted: "border-green bg-green/10 text-green",
  rejected: "border-red bg-red/10 text-red",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RosterStatus | "all">("pending");
  const [placeOn, setPlaceOn] = useState<Record<string, ClanTeam | "">>({});

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) setError(error.message);
    else setApps(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  /** Creates the member and marks the application accepted. Returns an error message, or null on success. */
  async function acceptOne(app: Application, team: ClanTeam | "", userId: string | null): Promise<string | null> {
    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        ign: app.ign,
        clan_tag: app.clan_tag,
        status: app.status,
        whatsapp_name: app.whatsapp_name,
        whatsapp_number: app.whatsapp_number,
        mode: app.mode,
        mp_role: app.mp_role,
        clan_team: team || null,
        device: app.device,
        activity: app.activity,
        comps_experience: app.comps_experience,
        scrim_availability: app.scrim_availability,
        weapons: app.weapons,
        mp_operator: app.mp_operator,
        br_class: app.br_class,
      })
      .select("id")
      .single();

    if (memberError) {
      return /clan_team/i.test(memberError.message)
        ? "Run supabase/add_clan_teams.sql in the Supabase SQL editor, then try again."
        : memberError.message;
    }

    const { error: appError } = await supabase
      .from("applications")
      .update({
        roster_status: "accepted",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        member_id: member.id,
      })
      .eq("id", app.id);

    return appError ? appError.message : null;
  }

  async function rejectOne(app: Application, userId: string | null): Promise<string | null> {
    const { error } = await supabase
      .from("applications")
      .update({
        roster_status: "rejected",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    return error ? error.message : null;
  }

  async function handleAccept(app: Application) {
    setBusyId(app.id);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const message = await acceptOne(app, placeOn[app.id] ?? "", user?.id ?? null);
    setBusyId(null);
    if (message) {
      setError(message);
      toastError(message);
    } else {
      toastSuccess("Application accepted.");
      load();
    }
  }

  async function handleReject(app: Application) {
    setBusyId(app.id);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const message = await rejectOne(app, user?.id ?? null);
    setBusyId(null);
    if (message) {
      setError(message);
      toastError(message);
    } else {
      toastSuccess("Application rejected.");
      load();
    }
  }

  async function runBulk(kind: "accept" | "reject") {
    const targets = apps.filter((a) => sel.selected.includes(a.id) && a.roster_status === "pending");
    if (targets.length === 0) return;
    setBulkBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let ok = 0;
    let firstError: string | null = null;
    for (const app of targets) {
      const message = kind === "accept" ? await acceptOne(app, placeOn[app.id] || bulkTeam, user?.id ?? null) : await rejectOne(app, user?.id ?? null);
      if (message) firstError ??= message;
      else ok++;
    }
    setBulkBusy(false);
    setBulkRejectOpen(false);

    const verb = kind === "accept" ? "accepted" : "rejected";
    if (firstError) {
      setError(firstError);
      toastError(`${ok} ${verb}, ${targets.length - ok} failed: ${firstError}`);
    } else {
      toastSuccess(`${ok} application${ok === 1 ? "" : "s"} ${verb}.`);
    }
    sel.clear();
    load();
  }

  const visible = filter === "all" ? apps : apps.filter((a) => a.roster_status === filter);
  const pendingCount = apps.filter((a) => a.roster_status === "pending").length;

  const pendingVisibleCount = visible.filter((a) => a.roster_status === "pending").length;
  const sel = useSelection(visible.filter((a) => a.roster_status === "pending").map((a) => a.id));
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkTeam, setBulkTeam] = useState<ClanTeam | "">("");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Roster intake</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Applications
          </h1>
        </div>
        <div className="flex gap-1.5">
          {(["pending", "accepted", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`admin-chip ${filter === f ? "admin-chip-active" : ""}`}
            >
              {f}
              {f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-dim">Loading applications…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-text-dim">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingVisibleCount > 0 && (
            <label className="flex w-fit cursor-pointer items-center gap-2.5 !normal-case">
              <Check checked={sel.allSelected} indeterminate={sel.someSelected} onChange={sel.toggleAll} label="Select all pending applications" />
              <span className="text-[11px] uppercase tracking-[0.1em] text-text-dim">Select all pending ({pendingVisibleCount})</span>
            </label>
          )}
          {visible.map((app) => (
            <div key={app.id} className="admin-panel" style={sel.has(app.id) ? { borderColor: "var(--purple)", boxShadow: "0 0 28px -10px rgb(var(--grid-rgb) / 0.7)" } : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {app.roster_status === "pending" && (
                    <div className="pt-0.5">
                      <Check checked={sel.has(app.id)} onChange={() => sel.toggle(app.id)} label={`Select ${app.ign}`} />
                    </div>
                  )}
                  <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-text">{app.clan_tag}丨{app.ign}</span>
                    <span
                      className={`border px-2 py-[2px] text-[9.5px] font-semibold uppercase tracking-wide ${STATUS_STYLE[app.roster_status]}`}
                    >
                      {app.roster_status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-text-dim">
                    {new Date(app.submitted_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  </div>
                </div>
                {app.roster_status === "pending" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={placeOn[app.id] ?? ""}
                      onChange={(e) => setPlaceOn((p) => ({ ...p, [app.id]: e.target.value as ClanTeam | "" }))}
                      className="!min-h-0 !w-[148px] !py-1.5 !pr-7 !text-[11px]"
                    >
                      <option value="">Unassigned</option>
                      {CLAN_TEAMS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAccept(app)}
                      disabled={busyId === app.id}
                      className="border border-green px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-green"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(app)}
                      disabled={busyId === app.id}
                      className="border border-red px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-red"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 grid gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs sm:grid-cols-3">
                <div><span className="text-text-dim">WhatsApp: </span><span className="text-text">{app.whatsapp_name || "—"} · {app.whatsapp_number || "—"}</span></div>
                <div><span className="text-text-dim">Activity: </span><span className="text-text">{app.activity || "—"}</span></div>
                <div><span className="text-text-dim">Mode: </span><span className="text-text">{app.mode || "—"}</span></div>
                <div><span className="text-text-dim">MP Role: </span><span className="text-text">{app.mp_role || "—"}</span></div>
                <div><span className="text-text-dim">Device: </span><span className="text-text">{app.device || "—"}</span></div>
                <div><span className="text-text-dim">Comps exp: </span><span className="text-text">{app.comps_experience ? "Yes" : "No"}</span></div>
                <div><span className="text-text-dim">Scrim avail: </span><span className="text-text">{app.scrim_availability ? "Yes" : "No"}</span></div>
                <div><span className="text-text-dim">MP Operator: </span><span className="text-text">{app.mp_operator || "—"}</span></div>
                <div><span className="text-text-dim">BR Class: </span><span className="text-text">{app.br_class || "—"}</span></div>
                <div className="sm:col-span-3"><span className="text-text-dim">Weapons: </span><span className="text-text">{app.weapons || "—"}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BulkBar count={sel.count} noun="application" onClear={sel.clear}>
        <select
          value={bulkTeam}
          onChange={(e) => setBulkTeam(e.target.value as ClanTeam | "")}
          className="!min-h-0 !w-[140px] !py-1.5 !pr-7 !text-[11px]"
          aria-label="Team for accepted members"
        >
          <option value="">Unassigned</option>
          {CLAN_TEAMS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <BulkButton tone="good" onClick={() => runBulk("accept")} disabled={bulkBusy}>
          {bulkBusy ? "Working…" : "Accept"}
        </BulkButton>
        <BulkButton tone="danger" onClick={() => setBulkRejectOpen(true)} disabled={bulkBusy}>
          Reject
        </BulkButton>
      </BulkBar>

      <BulkConfirm
        open={bulkRejectOpen}
        onClose={() => setBulkRejectOpen(false)}
        title="Reject applications?"
        message={<>Reject <b className="text-text">{sel.count}</b> selected application{sel.count === 1 ? "" : "s"}?</>}
        confirmLabel={`Reject ${sel.count}`}
        busy={bulkBusy}
        onConfirm={() => runBulk("reject")}
      />
    </div>
  );
}
