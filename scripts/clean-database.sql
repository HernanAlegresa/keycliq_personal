-- Script para limpiar completamente la base de datos
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de usuarios
-- Solo ejecutar en staging/production cuando se quiera comenzar desde cero

-- Orden de eliminación considerando foreign keys:
-- 1. Eliminar datos dependientes primero
TRUNCATE TABLE "key_matchings" CASCADE;
TRUNCATE TABLE "key_signatures" CASCADE;
TRUNCATE TABLE "key_queries" CASCADE;
TRUNCATE TABLE "keys" CASCADE;
TRUNCATE TABLE "PasswordResetToken" CASCADE;
TRUNCATE TABLE "Session" CASCADE;

-- 2. Eliminar usuarios (último)
TRUNCATE TABLE "User" CASCADE;

-- Verificar que las tablas están vacías
SELECT 
  'User' AS table_name, COUNT(*) AS count FROM "User"
UNION ALL
SELECT 'keys', COUNT(*) FROM "keys"
UNION ALL
SELECT 'key_signatures', COUNT(*) FROM "key_signatures"
UNION ALL
SELECT 'key_queries', COUNT(*) FROM "key_queries"
UNION ALL
SELECT 'key_matchings', COUNT(*) FROM "key_matchings"
UNION ALL
SELECT 'Session', COUNT(*) FROM "Session"
UNION ALL
SELECT 'PasswordResetToken', COUNT(*) FROM "PasswordResetToken";

