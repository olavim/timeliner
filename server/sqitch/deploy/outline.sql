-- Deploy timeliner:timeline to pg

BEGIN;

CREATE TABLE timeliner.timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE timeliner.timeline OWNER TO timeliner;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE timeliner.timeline TO timeliner_rw;

CREATE TRIGGER refresh_timeline_updated_at BEFORE UPDATE
  ON timeliner.timeline FOR EACH ROW EXECUTE PROCEDURE
  timeliner.refresh_updated_at();

COMMIT;
