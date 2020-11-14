-- Create timeliner and timeliner_rw roles for timeliner schemas

BEGIN;

DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'timeliner') THEN
      CREATE ROLE timeliner NOLOGIN;
   END IF;
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'timeliner_rw') THEN
		CREATE ROLE timeliner_rw LOGIN PASSWORD 'timeliner';
   END IF;
END
$do$;

COMMIT;
