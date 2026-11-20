export interface HospitalQuickStat {
  id: string;
  label: string;
  value: string;
  change: string;
  iconName: "pulse" | "stethoscope" | "activity" | "users";
}

export interface DepartmentHighlight {
  id: string;
  name: string;
  status: "Tersedia" | "Padat" | "Buka";
  doctorOnDuty: string;
  waitingCount: number;
}
