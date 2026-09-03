import { CLAN_TEAM_STYLE, clanTeamMeta } from "@/lib/gameData";
import {
  HISTORY_DOT_STYLE,
  HISTORY_EVENT_STYLE,
  formatHistoryWhen,
  historyEventLabel,
  historyHeadline,
} from "@/lib/history";
import type { MemberHistory } from "@/lib/supabase/types";

export default function Timeline({ events }: { events: MemberHistory[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-text-dim">No history yet.</p>;
  }

  return (
    <ol className="relative ml-2 border-l border-line pl-6">
      {events.map((event) => {
        const from = clanTeamMeta(event.from_team);
        const to = clanTeamMeta(event.to_team);
        return (
          <li key={event.id} className="relative pb-7 last:pb-0">
            <span
              className={`absolute top-1.5 -left-[31px] h-2.5 w-2.5 rounded-full ${HISTORY_DOT_STYLE[event.event_type]}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`border px-2 py-[2px] text-[9.5px] font-semibold uppercase tracking-wide ${HISTORY_EVENT_STYLE[event.event_type]}`}
              >
                {historyEventLabel(event.event_type)}
              </span>
              <span className="text-[11px] text-text-dim">{formatHistoryWhen(event.created_at)}</span>
            </div>
            <div className="mt-1.5 text-[13.5px] font-semibold text-text">{historyHeadline(event)}</div>
            {(from || to) && event.event_type !== "exited" && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-dim">
                {from && (
                  <span className={`border px-2 py-[2px] font-semibold uppercase tracking-wide ${CLAN_TEAM_STYLE[from.id]}`}>
                    {from.label}
                  </span>
                )}
                {from && <span>→</span>}
                <span
                  className={`border px-2 py-[2px] font-semibold uppercase tracking-wide ${
                    to ? CLAN_TEAM_STYLE[to.id] : "border-line text-text-dim"
                  }`}
                >
                  {to?.label ?? "Unassigned"}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
