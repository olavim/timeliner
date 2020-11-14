-- Deploy timeliner:init to pg

BEGIN;

CREATE SCHEMA timeliner AUTHORIZATION timeliner;
GRANT USAGE ON SCHEMA timeliner TO timeliner_rw;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

COMMIT;
