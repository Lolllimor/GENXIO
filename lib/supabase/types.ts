export type MemberStatus = "ACTIVE" | "INACTIVE";
export type Mode = "MP" | "BR" | "Hybrid";
export type Activity = "Low" | "Average" | "High";
export type ClanTeam = "e-sport" | "elites" | "underdog";
export type HistoryEventType = "added" | "assigned" | "promoted" | "demoted" | "unassigned" | "exited";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type RosterStatus = "pending" | "accepted" | "rejected";

export interface Member {
  id: string;
  ign: string;
  clan_tag: string;
  whatsapp_name: string | null;
  whatsapp_number: string | null;
  status: MemberStatus;
  clan_team: ClanTeam | null;
  mode: Mode | null;
  mp_role: string | null;
  device: string | null;
  notes: string | null;
  activity: Activity | null;
  comps_experience: boolean | null;
  scrim_availability: boolean | null;
  weapons: string | null;
  mp_operator: string | null;
  br_class: string | null;
  professional_name: string | null;
  uid: string | null;
  discord: string | null;
  country: string | null;
  device_serial_number: string | null;
  joined_at: string;
  created_at: string;
}

export interface MemberHistory {
  id: string;
  member_id: string | null;
  ign: string;
  event_type: HistoryEventType;
  from_team: ClanTeam | null;
  to_team: ClanTeam | null;
  created_by: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  clan_tag: string;
  ign: string;
  status: MemberStatus;
  whatsapp_name: string | null;
  whatsapp_number: string | null;
  activity: string | null;
  mode: string | null;
  mp_role: string | null;
  device: string | null;
  comps_experience: boolean | null;
  scrim_availability: boolean | null;
  weapons: string | null;
  mp_operator: string | null;
  br_class: string | null;
  submitted_at: string;
  roster_status: RosterStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  member_id: string | null;
}

export interface Exit {
  id: string;
  ign: string;
  role_at_exit: string | null;
  device: string | null;
  weapons: string | null;
  date_joined: string | null;
  date_exited: string;
  reason_for_exit: string | null;
  whatsapp_number: string | null;
  member_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface OrgSettings {
  id: true;
  organization_name: string | null;
  team_name: string | null;
  team_tag: string | null;
  manager_discord: string | null;
  updated_at: string;
}

export interface MemberAttendanceStats {
  member_id: string;
  matches_played: number;
  matches_recorded: number;
  attendance_pct: number;
}

export interface Scrim {
  id: string;
  scrim_date: string;
  opponent: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type TeamSlot = "main" | "sub";

export interface ScrimTeam {
  id: string;
  scrim_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ScrimAttendance {
  id: string;
  scrim_id: string;
  member_id: string;
  status: AttendanceStatus;
  team_id: string | null;
  slot: TeamSlot | null;
  note: string | null;
}

export interface MatchResult {
  id: string;
  scrim_id: string;
  lobby_number: number;
  position: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MatchResultKill {
  id: string;
  match_result_id: string;
  member_id: string;
  kills: number;
}

export interface NewsPost {
  id: string;
  tag: string;
  title: string;
  body: string;
  published: boolean;
  post_date: string;
  created_by: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  result: string;
  title: string;
  description: string;
  published: boolean;
  achieved_on: string;
  created_by: string | null;
  created_at: string;
}
