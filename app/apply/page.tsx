"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { MP_OPERATORS, BR_CLASSES } from "@/lib/gameData";

type ToggleValue = "" | "Yes" | "No";

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-panel">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-line pb-3.5">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.18em] text-purple">
            {step}
          </div>
          <div className="mt-0.5 font-display text-base font-bold uppercase tracking-wide text-text">
            {title}
          </div>
        </div>
        <p className="hidden max-w-[220px] text-right text-[11px] leading-relaxed text-text-dim sm:block">
          {hint}
        </p>
      </div>
      {children}
    </div>
  );
}

function ChoiceRow({
  label,
  required,
  options,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label>
        {label}
        {required ? <span className="text-red"> *</span> : null}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            className={`apply-choice ${value === v ? "apply-choice-active" : ""}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ApplyPage() {
  const [ign, setIgn] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [waName, setWaName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [activity, setActivity] = useState("");
  const [mode, setMode] = useState("");
  const [mpRole, setMpRole] = useState("");
  const [device, setDevice] = useState("");
  const [comps, setComps] = useState<ToggleValue>("");
  const [scrim, setScrim] = useState<ToggleValue>("");
  const [weapons, setWeapons] = useState("");
  const [mpOperator, setMpOperator] = useState("");
  const [brClass, setBrClass] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const clanTagPreview = `G¹ | ${ign.trim() || "—"}`;

  function resetForm() {
    setIgn("");
    setStatus("ACTIVE");
    setWaName("");
    setWaNumber("");
    setActivity("");
    setMode("");
    setMpRole("");
    setDevice("");
    setComps("");
    setScrim("");
    setWeapons("");
    setMpOperator("");
    setBrClass("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!ign.trim()) {
      setMsg({ text: "IGN is required.", ok: false });
      return;
    }
    if (!activity) {
      setMsg({ text: "Please select Activity Level.", ok: false });
      return;
    }
    if (!mode) {
      setMsg({ text: "Please select Mode.", ok: false });
      return;
    }
    if (!comps) {
      setMsg({ text: "Please answer Comp Experience.", ok: false });
      return;
    }
    if (!scrim) {
      setMsg({ text: "Please answer Scrim Availability.", ok: false });
      return;
    }
    if (!supabaseConfigured) {
      setMsg({ text: "Applications aren't set up yet — check back soon.", ok: false });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("applications").insert({
        clan_tag: "G¹",
        ign: ign.trim(),
        status,
        whatsapp_name: waName.trim() || null,
        whatsapp_number: waNumber.trim() || null,
        activity,
        mode,
        mp_role: mpRole.trim() || null,
        device: device.trim() || null,
        comps_experience: comps === "Yes",
        scrim_availability: scrim === "Yes",
        weapons: weapons.trim() || null,
        mp_operator: mpOperator,
        br_class: brClass,
      });

      if (error) throw error;

      setMsg({
        text: `Application submitted — we'll review it and get back to you, ${`G¹ | ${ign.trim()}`}.`,
        ok: true,
      });
      resetForm();
    } catch (err) {
      console.error(err);
      setMsg({ text: "Something went wrong saving your application. Please try again.", ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute right-[-140px] top-16 h-[320px] w-[320px] bg-contain bg-center bg-no-repeat grayscale md:h-[480px] md:w-[480px]"
        style={{ backgroundImage: "url(/logo.jpg)", opacity: "var(--decoration-opacity)" }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-6 pt-14 md:px-8 md:pt-[60px]">
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <div className="eyebrow">Roster intake</div>
          <span className="live-dot">Recruiting</span>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-display text-[28px] font-bold uppercase tracking-tight text-text md:text-[42px]">
              Apply to <span className="text-purple [text-shadow:0_0_22px_rgba(139,92,246,0.45)]">GenXio</span>
            </h1>
            <p className="mt-3 text-[13.5px] leading-[1.75] text-text-dim">
              Request a slot on the <span className="font-semibold text-text">G¹</span> roster. We review activity, comms, and in-game skill — not just rank.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="admin-chip">01 Identity</span>
            <span className="admin-chip">02 Playstyle</span>
            <span className="admin-chip">03 Loadout</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 mx-auto max-w-5xl px-5 pb-20 md:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <Section step="01 — Identity" title="Who are you" hint="Your IGN will be tagged G¹ on the roster.">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label>
                  In-game name (IGN) <span className="text-red">*</span>
                </label>
                <input value={ign} onChange={(e) => setIgn(e.target.value)} placeholder="e.g. Mide" required />
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-text-dim">
                  <span>Clan tag preview</span>
                  <span className="font-display font-semibold tracking-wide text-purple">{clanTagPreview}</span>
                </div>
              </div>
              <div>
                <label>WhatsApp name <span className="text-red">*</span></label>
                <input value={waName} onChange={(e) => setWaName(e.target.value)} placeholder="e.g. ~Justayomide" required />
              </div>
              <div>
                <label>WhatsApp number <span className="text-red">*</span></label>
                <input
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="+234 700 000 0000"
                  required
                  type="tel"
                />
              </div>
                <ChoiceRow
                  label="Status"
                  options={["ACTIVE", "INACTIVE"]}
                  value={status}
                  onChange={setStatus}
                />
            </div>
          </Section>

          <Section step="02 — Playstyle" title="How you play" hint="Be honest. We build teams around this.">
            <div className="grid gap-4">
              <ChoiceRow
                label="Activity level"
                required
                options={["Low", "Average", "High"]}
                value={activity}
                onChange={setActivity}
              />
              <ChoiceRow
                label="Mode"
                required
                options={["MP", "BR", "Hybrid"]}
                value={mode}
                onChange={setMode}
              />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label>
                    MP role <span className="text-red">*</span>
                  </label>
                  <input
                    value={mpRole}
                    onChange={(e) => setMpRole(e.target.value)}
                    placeholder="Slayer, Objective, Anchor…"
                    required
                  />
                </div>
                <div>
                  <label>
                    Device <span className="text-red">*</span>
                  </label>
                  <input
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <ChoiceRow
                  label="Comp experience"
                  required
                  options={["Yes", "No"]}
                  value={comps}
                  onChange={(v) => setComps(v as ToggleValue)}
                />
                <ChoiceRow
                  label="Scrim availability"
                  required
                  options={["Yes", "No"]}
                  value={scrim}
                  onChange={(v) => setScrim(v as ToggleValue)}
                />
              </div>
            </div>
          </Section>
        </div>

        <div className="mt-4">
          <Section step="03 — Loadout" title="What you run" hint="Main guns and operator / class.">
            <div className="grid gap-3.5 md:grid-cols-3">
              <div className="md:col-span-3">
                <label>
                  Weapon(s) <span className="text-red">*</span>
                </label>
                <input
                  value={weapons}
                  onChange={(e) => setWeapons(e.target.value)}
                  placeholder="e.g. USS9, Type 19"
                  required
                />
              </div>
              <div>
                <label>
                  MP operator <span className="text-red">*</span>
                </label>
                <select value={mpOperator} onChange={(e) => setMpOperator(e.target.value)} required>
                  <option value="">Select…</option>
                  {MP_OPERATORS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label>
                  BR class <span className="text-red">*</span>
                </label>
                <select value={brClass} onChange={(e) => setBrClass(e.target.value)} required>
                  <option value="">Select…</option>
                  {BR_CLASSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </Section>
        </div>

        {msg && (
          <div
            className={`mt-4 border px-4 py-3.5 text-[13px] [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)] ${
              msg.ok ? "border-green bg-green/10 text-green" : "border-red bg-red/10 text-red"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border border-line bg-panel/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
          <p className="text-[12px] leading-relaxed text-text-dim">
            Submissions go to command for review. Use a WhatsApp number we can reach.
          </p>
          <button type="submit" disabled={submitting} className="btn btn-primary min-h-[48px] shrink-0 sm:min-w-[220px]">
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}
