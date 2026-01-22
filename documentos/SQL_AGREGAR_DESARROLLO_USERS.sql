-- ============================================================================
-- SQL para agregar columna 'desarrollo' a la tabla users
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. Agregar la columna desarrollo a la tabla users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS desarrollo VARCHAR(100);

-- 2. Crear índice para optimizar búsquedas por desarrollo
CREATE INDEX IF NOT EXISTS idx_users_desarrollo ON users(desarrollo);

-- 3. Actualizar usuarios existentes basándose en su email
-- Bosques de Cholul
UPDATE users SET desarrollo = 'Bosques de Cholul'
WHERE LOWER(email) IN ('a.lopez@grupoprovi.mx', 'e.flota@grupoprovi.mx', 'j.estrada@grupoprovi.mx');

-- Cumbres de San Pedro
UPDATE users SET desarrollo = 'Cumbres de San Pedro'
WHERE LOWER(email) IN ('m.vivas@grupoprovi.mx', 'j.zapata@grupoprovi.mx', 'r.cortes@grupoprovi.mx');

-- Paraíso Caucel
UPDATE users SET desarrollo = 'Paraíso Caucel'
WHERE LOWER(email) IN ('l.lopez@grupoprovi.mx', 'g.varela@grupoprovi.mx', 'z.martin@grupoprovi.mx');

-- 4. Verificar los cambios
SELECT id, name, email, desarrollo, is_active
FROM users
WHERE desarrollo IS NOT NULL
ORDER BY desarrollo, name;

-- ============================================================================
-- NOTAS:
-- - Después de ejecutar este SQL, la sincronización desde Kommo mantendrá
--   el campo desarrollo actualizado automáticamente basándose en el email.
-- - Si se agrega un nuevo asesor, agregar su email al mapeo en:
--   src/lib/sync-engine/transformers/users.transformer.js
-- ============================================================================
