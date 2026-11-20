export type Role = "coordinator" | "doctor" | "manager";

export interface DemoAccount {
  id: string;
  name: string;
  role: Role;
  initials: string;
  title: string;
  avatar?: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  available: boolean;
  unavailableReason?: string;
  basePatients: number;
}

export type CaseStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "no_show"
  | "visited"
  | "in_treatment"
  | "controlled"
  | "closed";

export type ConversationStatus =
  | "active"
  | "awaiting"
  | "no_response"
  | "handed_over"
  | "urgent"
  | "idle";

export type ReasonCode =
  | "FEEL_WELL"
  | "NO_TIME"
  | "OTHER_CLINIC"
  | "FEAR_MEDS"
  | "INSURANCE"
  | "DONT_KNOW_HOW"
  | "NO_ESCORT"
  | "OTHER";

export type Priority = "urgent" | "handed_over" | "overdue" | "unassigned" | "normal";

export type ConsentLevel = "schedule" | "attendance" | "full";

export type ClosureType = "controlled" | "transferred" | "declined" | "other";

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: "F" | "M";
  area: "North" | "East" | "South" | "West";
  registeredClinic: string;
  insuranceStatus: "active" | "inactive";
}

export interface FamilyContact {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  consentLevel: ConsentLevel;
  consentDay: number;
  revoked: boolean;
}

export interface ReasonEntry {
  code: ReasonCode;
  source: "button" | "simulated-ai";
  confidence?: number;
  day: number;
}

export interface Appointment {
  day: number;
  time: string;
  status: "booked" | "attended" | "missed";
}

export interface CaseRecord {
  id: string;
  patientId: string;
  systolic: number;
  diastolic: number;
  resultDay: number;
  status: CaseStatus;
  conversation: ConversationStatus;
  /** Who is responsible right now */
  ownerType: "vani" | "coordinator" | "doctor";
  /** Coordinator assigned to the case (for "My cases"); undefined = unassigned */
  coordinatorId?: string;
  assignedDoctorId?: string;
  takeoverBy?: string;
  reasons: ReasonEntry[];
  appointment?: Appointment;
  visitsInTarget: number;
  visits: number;
  awaitingSince?: number;
  familyContacted: boolean;
  escalated: boolean;
  urgentSince?: number;
  handoverNote?: string;
  /** Step in the scripted chat flow, used to decide which buttons to show */
  flow?: "reason" | "transfer_guide" | "book" | "slots" | "none";
  unread: boolean;
  closure?: { type: ClosureType; note: string; by: string; day: number };
}

export type Sender = "vani" | "staff" | "patient" | "family";

export interface Message {
  id: string;
  caseId: string;
  from: Sender;
  /** Audience for Vani/staff messages */
  to?: "patient" | "family";
  senderName: string;
  text: string;
  buttons?: string[];
  day: number;
  time: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  label: string;
  actor: string;
  day: number;
  kind: "result" | "message" | "reason" | "handover" | "schedule" | "visit" | "closure" | "family" | "clinical" | "system";
}

export interface DemoState {
  version: number;
  day: number;
  activeAccountId: string;
  patients: Patient[];
  families: FamilyContact[];
  cases: CaseRecord[];
  messages: Message[];
  timeline: TimelineEvent[];
  openCaseId?: string;
  phoneOpen: boolean;
  phoneCaseId: string;
  phoneTab: "patient" | "family";
  seq: number;
}

export interface SimulatedAiResult {
  reason: ReasonCode;
  confidence: number;
  urgent: boolean;
  matchedTerms: string[];
}
