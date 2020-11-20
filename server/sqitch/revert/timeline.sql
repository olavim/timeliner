-- Revert timeliner:timeline from pg

BEGIN;

DROP TABLE IF EXISTS timeliner.timeline;

COMMIT;
