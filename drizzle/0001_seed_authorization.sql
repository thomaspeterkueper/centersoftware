INSERT INTO "app"."permission" ("key", "description") VALUES
  ('center.read', 'Center anzeigen'),
  ('center.manage', 'Center verwalten'),
  ('people.read', 'Personen anzeigen'),
  ('people.manage', 'Personen verwalten'),
  ('staff.read', 'Mitarbeitende anzeigen'),
  ('staff.manage', 'Mitarbeitende verwalten'),
  ('appointments.read', 'Termine anzeigen'),
  ('appointments.manage', 'Termine verwalten'),
  ('documents.read', 'Dokumente anzeigen'),
  ('documents.manage', 'Dokumente verwalten'),
  ('billing.read', 'Abrechnung anzeigen'),
  ('billing.manage', 'Abrechnung verwalten'),
  ('authorization.manage', 'Rollen und Berechtigungen verwalten')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "app"."role" ("key", "name", "description") VALUES
  ('owner', 'Owner', 'Vollzugriff auf ein Center'),
  ('admin', 'Administrator', 'Operative Administration ohne Center-Eigentumsrechte'),
  ('staff', 'Mitarbeiter', 'Operative Arbeit mit Personen, Terminen und Dokumenten'),
  ('readOnly', 'Nur Lesen', 'Lesender Zugriff auf freigegebene Bereiche')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "app"."role_permission" ("role_id", "permission_key")
SELECT r."id", p."key"
FROM "app"."role" r
CROSS JOIN "app"."permission" p
WHERE r."key" = 'owner'
ON CONFLICT DO NOTHING;

INSERT INTO "app"."role_permission" ("role_id", "permission_key")
SELECT r."id", p."key"
FROM "app"."role" r
JOIN "app"."permission" p ON p."key" <> 'center.manage'
WHERE r."key" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "app"."role_permission" ("role_id", "permission_key")
SELECT r."id", p."key"
FROM "app"."role" r
JOIN "app"."permission" p ON p."key" IN (
  'center.read',
  'people.read',
  'people.manage',
  'staff.read',
  'appointments.read',
  'appointments.manage',
  'documents.read',
  'documents.manage'
)
WHERE r."key" = 'staff'
ON CONFLICT DO NOTHING;

INSERT INTO "app"."role_permission" ("role_id", "permission_key")
SELECT r."id", p."key"
FROM "app"."role" r
JOIN "app"."permission" p ON p."key" IN (
  'center.read',
  'people.read',
  'staff.read',
  'appointments.read',
  'documents.read',
  'billing.read'
)
WHERE r."key" = 'readOnly'
ON CONFLICT DO NOTHING;
