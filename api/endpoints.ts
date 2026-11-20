export const API_ENDPOINTS = {
  HEALTH: "/api/health",
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
  },
  PATIENTS: {
    LIST: "/api/patients",
    DETAIL: (id: string) => `/api/patients/${id}`,
  },
  APPOINTMENTS: {
    LIST: "/api/appointments",
    CREATE: "/api/appointments",
  },
  ANALYTICS: {
    SUMMARY: "/api/analytics/summary",
  },
} as const;
