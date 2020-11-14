-- Verify timeliner:updatedatfunc on pg

BEGIN;

SELECT has_function_privilege('timeliner.refresh_updated_at()', 'execute');

ROLLBACK;
