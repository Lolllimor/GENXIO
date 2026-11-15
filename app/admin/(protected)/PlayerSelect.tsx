"use client";

import { Select } from "@mantine/core";

export interface PickablePlayer {
  id: string;
  ign: string;
  clan_tag: string;
}

const styles = {
  input: {
    background: "var(--panel-2)",
    border: "1px solid var(--line)",
    color: "var(--text)",
    borderRadius: 0,
    minHeight: 34,
    height: 34,
    fontSize: 12.5,
    fontFamily: "var(--font-mono)",
  },
  dropdown: { background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 0 },
  option: { fontSize: 12.5, fontFamily: "var(--font-mono)", borderRadius: 0 },
};

/** Searchable player dropdown. Players in `used` are greyed out unless they're this slot's own pick. */
export default function PlayerSelect({ value, players, used, onChange, label }: { value: string; players: PickablePlayer[]; used: Set<string>; onChange: (id: string) => void; label: string }) {
  const data = players.map((p) => ({
    value: p.id,
    label: `${p.clan_tag}丨${p.ign}`,
    disabled: used.has(p.id) && p.id !== value,
  }));
  return (
    <Select
      data={data}
      value={value || null}
      onChange={(v) => onChange(v ?? "")}
      placeholder="Search a player…"
      searchable
      clearable
      nothingFoundMessage="No player found"
      maxDropdownHeight={260}
      comboboxProps={{ withinPortal: true, zIndex: 400 }}
      styles={styles}
      aria-label={label}
    />
  );
}
