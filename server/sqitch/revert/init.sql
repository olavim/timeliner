-- Revert timeliner:init from pg

BEGIN;

DROP SCHEMA timeliner;

COMMIT;
