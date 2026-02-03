-- Minimal schema for LocalStack integration testing
-- This creates just enough structure for the lambdas to run without errors

CREATE SCHEMA IF NOT EXISTS u_flood;

-- FWIS tables
CREATE TABLE IF NOT EXISTS u_flood.fwis_import (
    situation TEXT,
    ta_id INTEGER,
    ta_code TEXT,
    ta_name TEXT,
    ta_description TEXT,
    quick_dial TEXT,
    ta_version TEXT,
    ta_category TEXT,
    owner_area TEXT,
    ta_created_date TIMESTAMP,
    ta_modified_date TIMESTAMP,
    situation_changed TIMESTAMP,
    severity_changed TIMESTAMP,
    message_received TIMESTAMP,
    severity_value TEXT,
    severity TEXT
);

CREATE TABLE IF NOT EXISTS u_flood.current_fwis (
    situation TEXT,
    ta_id INTEGER,
    ta_code TEXT,
    ta_name TEXT,
    ta_description TEXT,
    quick_dial TEXT,
    ta_version TEXT,
    ta_category TEXT,
    owner_area TEXT,
    ta_created_date TIMESTAMP,
    ta_modified_date TIMESTAMP,
    situation_changed TIMESTAMP,
    severity_changed TIMESTAMP,
    message_received TIMESTAMP,
    severity_value TEXT,
    severity TEXT
);

CREATE TABLE IF NOT EXISTS u_flood.fwis_last_updated (
    id INTEGER PRIMARY KEY DEFAULT 1,
    timestamp INTEGER
);

INSERT INTO u_flood.fwis_last_updated (id, timestamp) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Telemetry tables
CREATE TABLE IF NOT EXISTS u_flood.sls_telemetry_value (
    telemetry_id SERIAL PRIMARY KEY,
    telemetry_value_parent_id INTEGER,
    value NUMERIC,
    value_timestamp TIMESTAMP,
    error BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS u_flood.sls_telemetry_station (
    station_reference TEXT PRIMARY KEY,
    region TEXT,
    station_name TEXT,
    ngr TEXT,
    easting NUMERIC,
    northing NUMERIC,
    CONSTRAINT unique_station UNIQUE (station_reference)
);

CREATE TABLE IF NOT EXISTS u_flood.sls_telemetry_value_parent (
    telemetry_value_parent_id SERIAL PRIMARY KEY,
    filename TEXT,
    imported TIMESTAMP,
    rloi_id INTEGER,
    station TEXT,
    region TEXT,
    start_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP,
    parameter TEXT,
    qualifier TEXT,
    units TEXT,
    post_process BOOLEAN,
    subtract NUMERIC,
    por_max_value NUMERIC,
    station_type TEXT,
    percentile_5 NUMERIC,
    data_type TEXT,
    period TEXT
);

-- Flood warnings
CREATE TABLE IF NOT EXISTS u_flood.ffoi_import (
    ffoi_import_id SERIAL PRIMARY KEY,
    ffoi_station_threshold_id INTEGER,
    value NUMERIC,
    value_timestamp TIMESTAMP
);

-- Materialized views (create as empty tables for testing)
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.telemetry_context_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.station_split_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.stations_overview_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.impact_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.rivers_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.rainfall_stations_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.stations_list_mview AS SELECT 1 as id WHERE FALSE;
CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.fwis_warnings_mview AS SELECT 1 as id WHERE FALSE;

GRANT ALL ON SCHEMA u_flood TO test;
GRANT ALL ON ALL TABLES IN SCHEMA u_flood TO test;
GRANT ALL ON ALL SEQUENCES IN SCHEMA u_flood TO test;
