export const PERMISSIONS = [
  "center.read",
  "center.manage",
  "people.read",
  "people.manage",
  "staff.read",
  "staff.manage",
  "appointments.read",
  "appointments.manage",
  "documents.read",
  "documents.manage",
  "billing.read",
  "billing.manage",
  "authorization.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PRESETS = {
  owner: PERMISSIONS,
  admin: PERMISSIONS.filter((permission) => permission !== "center.manage"),
  staff: [
    "center.read",
    "people.read",
    "people.manage",
    "staff.read",
    "appointments.read",
    "appointments.manage",
    "documents.read",
    "documents.manage",
  ],
  readOnly: [
    "center.read",
    "people.read",
    "staff.read",
    "appointments.read",
    "documents.read",
    "billing.read",
  ],
} as const satisfies Record<string, readonly Permission[]>;
