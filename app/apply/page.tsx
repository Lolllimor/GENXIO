"use client";

import { useState, FormEvent } from "react";

const MP_OPERATORS = [
  "Purifier", "Annihilator", "Death Machine", "Gravity Vortex Gun", "Equalizer",
  "Ballista EM3", "Ballistic Shield", "Barricade", "Bull Charge", "Claw",
  "Control Field", "H.I.V.E.", "Havoc", "K9-Unit", "Kinetic Armor",
  "Misdirection Device", "Munitions Box", "Reactor Core", "Scythe", "Shadow Blade",
  "Sparrow", "Tac-Deploy", "TAK-5", "Tempest", "Transform Shield", "War Machine", "Other",
];

const BR_CLASSES = [
  "Ninja", "Medic", "Scout", "Mechanic", "Defender", "Airborne", "Clown", "Trickster",
  "Shockwave", "Spotter", "Toxic Overload", "Desperado", "Rewind", "Jet Boost",
  "Tactical Mirror", "Smoke Bomber", "Trap Master", "Pumped", "Quick Strike", "Other",
];

const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwPjKjm_NTaPWF63Y7kPLK3-gPdaVnrmCJNSG0MRAs9zkq77J20T028Upo3WU3V3X-aUw/exec";

type ToggleValue = "" | "Yes" | "No";

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
    if (!comps) {
      setMsg({ text: "Please answer Comp Experience.", ok: false });
      return;
    }
    if (!scrim) {
      setMsg({ text: "Please answer Scrim Availability.", ok: false });
      return;
    }

    const entry = {
      clanTag: `G¹ | ${ign.trim()}`,
      ign: ign.trim(),
      status,
      whatsappName: waName.trim(),
      whatsappNumber: waNumber.trim(),
      activity,
      mode,
      mpRole: mpRole.trim(),
      device: device.trim(),
      compsExperience: comps,
      scrimAvailability: scrim,
      weapons: weapons.trim(),
      mpOperator,
      brClass,
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      await submitViaHiddenForm(entry);
      setMsg({ text: `Application submitted — welcome to the roster, ${entry.clanTag}.`, ok: true });
      resetForm();
    } catch (err) {
      console.error(err);
      setMsg({ text: "Something went wrong saving your application. Please try again.", ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  // Google Apps Script web apps don't send CORS headers, so a normal cross-origin
  // fetch() can't read the response. A hidden <form> POST to a hidden <iframe>
  // isn't subject to that restriction (only fetch/XHR response-reading is CORS-gated),
  // so this reliably delivers the data even though we can't read a confirmation back.
  function submitViaHiddenForm(entry: Record<string, string>): Promise<void> {
    return new Promise((resolve) => {
      const iframeName = "hidden-submit-" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = SHEET_ENDPOINT;
      form.target = iframeName;
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "payload";
      input.value = JSON.stringify(entry);
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      const cleanup = () => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
        resolve();
      };
      // Give the request a moment to actually leave the browser before resolving.
      setTimeout(cleanup, 1200);
    });
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-5 pb-5 pt-14 md:px-8 md:pt-[60px]">
        <div className="eyebrow mb-2.5">Roster Intake — Call of Duty Mobile</div>
        <h1 className="font-display text-[28px] font-bold uppercase tracking-tight text-white md:text-[38px]">
          New Member Sign-Up
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] text-text-dim">
          Fill this out to be added to the <b className="text-text">G¹</b> active roster. All
          fields are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-5 pb-20 pt-2 md:px-8">
        {/* Identity */}
        <div className="card mb-4">
          <div className="mb-[18px] border-b border-line pb-2.5 font-display text-[11px] uppercase tracking-[0.16em] text-purple">
            01 — Identity
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>In-Game Name (IGN) <span className="text-red">*</span></label>
              <input value={ign} onChange={(e) => setIgn(e.target.value)} placeholder="e.g. Mide" required />
              <div className="font-display mt-1.5 text-[11px] tracking-wide text-text-dim">
                Will show as <span className="font-semibold text-purple">{clanTagPreview}</span>
              </div>
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>WhatsApp Name</label>
              <input value={waName} onChange={(e) => setWaName(e.target.value)} placeholder="e.g. ~Justayomide" required />
            </div>
            <div>
              <label>WhatsApp Number</label>
              <input value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="+234 700 000 0000" required type="tel" />
            </div>
          </div>
        </div>

        {/* Playstyle */}
        <div className="card mb-4">
          <div className="mb-[18px] border-b border-line pb-2.5 font-display text-[11px] uppercase tracking-[0.16em] text-purple">
            02 — Playstyle
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Activity Level <span className="text-red">*</span></label>
              <select value={activity} onChange={(e) => setActivity(e.target.value)} required>
                <option value="">Select…</option>
                <option>Low</option>
                <option>Average</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label>Mode <span className="text-red">*</span></label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} required>
                <option value="">Select…</option>
                <option>MP</option>
                <option>BR</option>
                <option>Hybrid</option>
              </select>
            </div>
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>MP Role <span className="text-red">*</span></label>
              <input value={mpRole} onChange={(e) => setMpRole(e.target.value)} placeholder="e.g. Slayer, Objective & Anchor" required />
            </div>
            <div>
              <label>Device <span className="text-red">*</span></label>
              <input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="e.g. iPhone 15 Pro" required />
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Comp Experience? <span className="text-red">*</span></label>
              <div className="flex gap-2">
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setComps(v)}
                    className={`flex min-h-[44px] flex-1 items-center justify-center rounded-sm border text-xs tracking-wide transition-colors ${
                      comps === v ? "border-purple bg-purple/10 text-purple" : "border-line bg-panel-2 text-text-dim"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label>Scrim Availability? <span className="text-red">*</span></label>
              <div className="flex gap-2">
                {(["Yes", "No"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setScrim(v)}
                    className={`flex min-h-[44px] flex-1 items-center justify-center rounded-sm border text-xs tracking-wide transition-colors ${
                      scrim === v ? "border-purple bg-purple/10 text-purple" : "border-line bg-panel-2 text-text-dim"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loadout */}
        <div className="card mb-4">
          <div className="mb-[18px] border-b border-line pb-2.5 font-display text-[11px] uppercase tracking-[0.16em] text-purple">
            03 — Loadout
          </div>
          <div className="mb-3.5">
            <label>Weapon(s) <span className="text-red">*</span></label>
            <input value={weapons} onChange={(e) => setWeapons(e.target.value)} placeholder="e.g. USS9, Type 19" required />
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>MP Operator <span className="text-red">*</span></label>
              <select value={mpOperator} onChange={(e) => setMpOperator(e.target.value)} required>
                <option value="">Select…</option>
                {MP_OPERATORS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label>BR Class <span className="text-red">*</span></label>
              <select value={brClass} onChange={(e) => setBrClass(e.target.value)} required>
                <option value="">Select…</option>
                {BR_CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary min-h-[48px] w-full">
          {submitting ? "Submitting…" : "Submit Application"}
        </button>

        {msg && (
          <div
            className={`mt-3.5 rounded-sm border px-3.5 py-3 text-[12.5px] ${
              msg.ok
                ? "border-green bg-green/10 text-green"
                : "border-red bg-red/10 text-red"
            }`}
          >
            {msg.text}
          </div>
        )}
      </form>
    </>
  );
}
