-- Deploy timeliner:updatedatfunc to pg

BEGIN;

CREATE OR REPLACE FUNCTION timeliner.refresh_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ language 'plpgsql';

COMMIT;
