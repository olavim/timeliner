-- Revert timeliner:updatedatfunc from pg

BEGIN;

DROP FUNCTION timeliner.refresh_updated_at();

COMMIT;
