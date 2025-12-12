/*
  Migración manual segura:
  - Convierte Appointment.fecha a DateTime SIN perder datos
  - Añade UNIQUE(clientId, fecha)
*/

-- 1) Crear columna temporal DateTime
ALTER TABLE "Appointment"
ADD COLUMN "fecha_tmp" TIMESTAMP(3);

-- 2) Copiar datos antiguos a la nueva columna
-- Si la fecha antigua era texto tipo 'YYYY-MM-DD'
UPDATE "Appointment"
SET "fecha_tmp" = ("fecha"::date)::timestamp;

-- 3) Asegurar NOT NULL
ALTER TABLE "Appointment"
ALTER COLUMN "fecha_tmp" SET NOT NULL;

-- 4) Eliminar columna antigua
ALTER TABLE "Appointment"
DROP COLUMN "fecha";

-- 5) Renombrar columna nueva
ALTER TABLE "Appointment"
RENAME COLUMN "fecha_tmp" TO "fecha";

-- 6) Crear índice UNIQUE (clientId, fecha)
CREATE UNIQUE INDEX "Appointment_clientId_fecha_key"
ON "Appointment" ("clientId", "fecha");
