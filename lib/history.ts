import { clanTeamMeta } from "./gameData";
import type { HistoryEventType, MemberHistory } from "./supabase/types";

export const HISTORY_EVENTS = [
  { id: "added", label: "Added" },
  { id: "promoted", label: "Promoted" },
  { id: "demoted", label: "Demoted" },
  { id: "assigned", label: "Assigned" },
  { id: "unassigned", label: "Unassigned" },
  { id: "exited", label: "Exited" },
] as const satisfies readonly { id: HistoryEventType; label: string }[];

export const HISTORY_EVENT_STYLE: Record<HistoryEventType, string> = {
  added: "border-purple bg-purple/10 text-purple",
  assigned: "border-purple bg-purple/10 text-purple",
  promoted: "border-green bg-green/10 text-green",
  demoted: "border-amber bg-amber/10 text-amber",
  unassigned: "border-line bg-panel-2 text-text-dim",
  exited: "border-red bg-red/10 text-red",
};

export const HISTORY_DOT_STYLE: Record<HistoryEventType, string> = {
  added: "bg-purple",
  assigned: "bg-purple",
  promoted: "bg-green",
  demoted: "bg-amber",
  unassigned: "bg-text-dim",
  exited: "bg-red",
};

export function historyEventLabel(type: HistoryEventType) {
  return HISTORY_EVENTS.find((e) => e.id === type)?.label ?? type;
}

export function teamLabel(id: string | null | undefined) {
  return clanTeamMeta(id)?.label ?? (id ? id : "Unassigned");
}

export function historyHeadline(event: MemberHistory) {
  const to = event.to_team ? teamLabel(event.to_team) : null;
  const from = event.from_team ? teamLabel(event.from_team) : null;

  switch (event.event_type) {
    case "added":
      return to ? `${event.ign} joined ${to}` : `${event.ign} joined the roster`;
    case "assigned":
      return `${event.ign} placed on ${to ?? "a team"}`;
    case "promoted":
      return from ? `${event.ign} promoted from ${from} to ${to}` : `${event.ign} promoted to ${to}`;
    case "demoted":
      return from ? `${event.ign} demoted from ${from} to ${to}` : `${event.ign} demoted to ${to}`;
    case "unassigned":
      return from ? `${event.ign} removed from ${from}` : `${event.ign} unassigned`;
    case "exited":
      return `${event.ign} left the roster`;
  }
}

export function formatHistoryWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function historyMissingTable(message: string) {
  if (!/member_history/i.test(message)) return message;
  return "Run supabase/add_member_history.sql in the Supabase SQL editor, then try again.";
}
