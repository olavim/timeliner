-- Verify timeliner:init on pg

BEGIN;

SELECT 1/COUNT(*) FROM pg_roles WHERE rolname='timeliner';
SELECT 1/COUNT(*) FROM pg_roles WHERE rolname='timeliner_rw';
SELECT 1/COUNT(*) FROM information_schema.schemata WHERE schema_name='timeliner';

SELECT 1/count(installed_version) FROM pg_available_extensions WHERE name='uuid-ossp';

ROLLBACK;
