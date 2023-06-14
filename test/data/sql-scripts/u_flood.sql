CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS u_flood;

-- Create the tables in the u_flood schema

-- Create sequence current_fwis_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.current_fwis_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  england_010k_gid_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.england_010k_gid_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  ffoi_file_ffoi_file_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.ffoi_file_ffoi_file_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  ffoi_forecast_ffoi_forecast_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.ffoi_forecast_ffoi_forecast_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  ffoi_station_ffoi_station_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.ffoi_station_ffoi_station_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  ffoi_station_threshold_ffoi_station_threshold_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.ffoi_station_threshold_ffoi_station_threshold_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  flood_alert_area_2_gid_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.flood_alert_area_2_gid_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  flood_alert_area_gid_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.flood_alert_area_gid_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  flood_warning_area_gid_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.flood_warning_area_gid_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  fwis_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.fwis_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  impact_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.impact_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  sls_telemetry_station_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.sls_telemetry_station_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  sls_telemetry_value_parent_telemetry_value_parent_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.sls_telemetry_value_parent_telemetry_value_parent_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  sls_telemetry_value_telemetry_value_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.sls_telemetry_value_telemetry_value_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  station_imtd_threshold_station_threshold_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.station_imtd_threshold_station_threshold_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

    -- Create sequence IF NOT EXISTS  station_imtd_threshold_station_threshold_id_seq
CREATE SEQUENCE IF NOT EXISTS  station_imtd_threshold_station_threshold_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  station_threshold_station_threshold_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.station_threshold_station_threshold_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  telemetry_context_telemetry_context_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.telemetry_context_telemetry_context_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

    -- Create sequence IF NOT EXISTS  telemetry_context_telemetry_context_id_seq
CREATE SEQUENCE IF NOT EXISTS  telemetry_context_telemetry_context_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create sequence IF NOT EXISTS  time_series_region_lkp_time_series_lkp_id_seq
CREATE SEQUENCE IF NOT EXISTS  u_flood.time_series_region_lkp_time_series_lkp_id_seq
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START WITH 1
    NO CYCLE;

-- Create the current_load_timestamp table
CREATE TABLE IF NOT EXISTS u_flood.current_load_timestamp (
    id INTEGER NOT NULL,
    load_timestamp BIGINT,
    CONSTRAINT pk_current_load_timestamp PRIMARY KEY (id)
);

-- Create the databasechangelog table
CREATE TABLE IF NOT EXISTS u_flood.databasechangelog (
    id CHARACTER VARYING(255) NOT NULL,
    author CHARACTER VARYING(255) NOT NULL,
    filename CHARACTER VARYING(255) NOT NULL,
    dateexecuted TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
    orderexecuted INTEGER NOT NULL,
    exectype CHARACTER VARYING(10) NOT NULL,
    md5sum CHARACTER VARYING(35),
    description CHARACTER VARYING(255),
    comments CHARACTER VARYING(255),
    tag CHARACTER VARYING(255),
    liquibase CHARACTER VARYING(20),
    contexts CHARACTER VARYING(255),
    labels CHARACTER VARYING(255),
    deployment_id CHARACTER VARYING(10)
);

-- Create the databasechangeloglock table
CREATE TABLE IF NOT EXISTS u_flood.databasechangeloglock (
    id INTEGER NOT NULL,
    locked BOOLEAN NOT NULL,
    lockgranted TIMESTAMP(6) WITHOUT TIME ZONE,
    lockedby CHARACTER VARYING(255),
    CONSTRAINT pk_databasechangeloglock PRIMARY KEY (id)
);

-- Create the england_010k table
CREATE TABLE IF NOT EXISTS u_flood.england_010k (
    gid SERIAL NOT NULL,
    region_id NUMERIC,
    reg_name CHARACTER VARYING(22),
    reg_prop_n CHARACTER VARYING(24),
    reg_addr_1 CHARACTER VARYING(25),
    reg_addr_2 CHARACTER VARYING(25),
    reg_town CHARACTER VARYING(22),
    reg_pcode CHARACTER VARYING(20),
    geom geometry,
    PRIMARY KEY (gid)
);

-- Create the ffoi_max table
CREATE TABLE IF NOT EXISTS u_flood.ffoi_max (
    telemetry_id TEXT NOT NULL,
    value NUMERIC,
    value_date TIMESTAMP(6) WITH TIME ZONE,
    filename TEXT,
    updated_date TIMESTAMP(6) WITH TIME ZONE,
    CONSTRAINT pk_ffoi_max_telemetry_id PRIMARY KEY (telemetry_id)
);

-- Create the ffoi_station table
CREATE TABLE IF NOT EXISTS u_flood.ffoi_station (
    ffoi_station_id BIGSERIAL NOT NULL,
    rloi_id INTEGER NOT NULL,
    CONSTRAINT pk_ffoi_station_id PRIMARY KEY (ffoi_station_id)
);

-- Create the ffoi_station_threshold table
CREATE TABLE IF NOT EXISTS u_flood.ffoi_station_threshold (
    ffoi_station_threshold_id BIGSERIAL NOT NULL,
    ffoi_station_id BIGINT NOT NULL,
    fwis_code TEXT NOT NULL,
    value NUMERIC NOT NULL,
    CONSTRAINT pk_ffoi_station_threshold_id PRIMARY KEY (ffoi_station_threshold_id)
);

-- Create the flood_alert_area table
CREATE TABLE IF NOT EXISTS u_flood.flood_alert_area (
    gid SERIAL NOT NULL,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry,
    PRIMARY KEY (gid)
);

-- Create the flood_alert_area_2 table
CREATE TABLE IF NOT EXISTS u_flood.flood_alert_area_2 (
    gid SERIAL NOT NULL,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry,
    PRIMARY KEY (gid)
);

-- Create the flood_alert_area_20220223_backup table
CREATE TABLE IF NOT EXISTS u_flood.flood_alert_area_20220223_backup (
    gid INTEGER,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry
);

-- Create the flood_alert_area_20220511_backup table
CREATE TABLE IF NOT EXISTS u_flood.flood_alert_area_20220511_backup (
    gid INTEGER,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry
);

-- Create the flood_alert_area_valid table
CREATE TABLE IF NOT EXISTS u_flood.flood_alert_area_valid (
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry
);

-- Create the flood_warning_area table
CREATE TABLE IF NOT EXISTS u_flood.flood_warning_area (
    gid SERIAL NOT NULL,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    parent CHARACTER VARYING(50),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry,
    PRIMARY KEY (gid)
);

-- Create the flood_warning_area_20220223_backup table
CREATE TABLE IF NOT EXISTS u_flood.flood_warning_area_20220223_backup (
    gid INTEGER,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    parent CHARACTER VARYING(50),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry
);

-- Create the flood_warning_area_20220511_backup table
CREATE TABLE IF NOT EXISTS u_flood.flood_warning_area_20220511_backup (
    gid INTEGER,
    area CHARACTER VARYING(100),
    fws_tacode CHARACTER VARYING(50),
    ta_name CHARACTER VARYING(100),
    descrip CHARACTER VARYING(254),
    la_name CHARACTER VARYING(254),
    parent CHARACTER VARYING(50),
    qdial CHARACTER VARYING(50),
    river_sea CHARACTER VARYING(254),
    geom geometry
);

-- Create the fwis table
CREATE TABLE IF NOT EXISTS u_flood.fwis (
    id BIGSERIAL NOT NULL,
    situation TEXT,
    ta_id INTEGER,
    ta_code CHARACTER VARYING(200),
    ta_name TEXT,
    ta_description TEXT,
    quick_dial INTEGER,
    ta_version INTEGER,
    ta_category CHARACTER VARYING(200),
    owner_area CHARACTER VARYING(200),
    ta_created_date TIMESTAMP(6) WITH TIME ZONE,
    ta_modified_date TIMESTAMP(6) WITH TIME ZONE,
    situation_changed TIMESTAMP(6) WITH TIME ZONE,
    severity_changed TIMESTAMP(6) WITH TIME ZONE,
    message_received TIMESTAMP(6) WITH TIME ZONE,
    severity_value INTEGER,
    severity CHARACTER VARYING(200),
    PRIMARY KEY (id)
);

-- Create the impact table
CREATE TABLE IF NOT EXISTS u_flood.impact (
    id BIGSERIAL NOT NULL,
    rloi_id INTEGER NOT NULL,
    value NUMERIC,
    units TEXT,
    comment TEXT,
    short_name TEXT,
    description TEXT,
    type TEXT,
    obs_flood_year TEXT,
    obs_flood_month TEXT,
    source TEXT,
    lat NUMERIC,
    lng NUMERIC,
    geom geometry,
    PRIMARY KEY (id)
);

-- Create the imtd_niki table
CREATE TABLE IF NOT EXISTS u_flood.imtd_niki (
    station_threshold_id BIGINT DEFAULT nextval('u_flood.station_imtd_threshold_station_threshold_id_seq'::regclass) NOT NULL,
    station_id BIGINT NOT NULL,
    fwis_code TEXT NOT NULL,
    fwis_type CHARACTER(100) NOT NULL,
    direction CHARACTER(100) NOT NULL,
    value NUMERIC NOT NULL,
    CONSTRAINT pk_station_imtd_threshold PRIMARY KEY (station_threshold_id)
);

-- Create the river table
CREATE TABLE IF NOT EXISTS u_flood.river (
    id CHARACTER VARYING(200) NOT NULL,
    name CHARACTER VARYING(200),
    qualified_name CHARACTER VARYING(250),
    PRIMARY KEY (id)
);

-- Create the river_display table
CREATE TABLE IF NOT EXISTS u_flood.river_display (
    id INTEGER,
    local_name CHARACTER VARYING,
    qualified_name CHARACTER VARYING,
    river_id CHARACTER VARYING
);

-- Create the river_display_name table
CREATE TABLE IF NOT EXISTS u_flood.river_display_name (
    river_id TEXT,
    display TEXT
);

-- Create the river_stations table
CREATE TABLE IF NOT EXISTS u_flood.river_stations (
    river_id CHARACTER VARYING(200),
    rloi_id INTEGER,
    rank INTEGER
);

-- Create the river_stations_list_test table
CREATE TABLE IF NOT EXISTS u_flood.river_stations_list_test (
    id CHARACTER VARYING(200),
    name CHARACTER VARYING(200),
    rloi_id INTEGER,
    rank INTEGER,
    display_name TEXT
);

-- Create the sls_telemetry_station table
CREATE TABLE IF NOT EXISTS u_flood.sls_telemetry_station (
    telemetry_station_id BIGINT DEFAULT nextval('u_flood.sls_telemetry_station_id_seq'::regclass) NOT NULL,
    station_reference TEXT NOT NULL,
    region TEXT,
    station_name TEXT,
    ngr CHARACTER VARYING(50),
    easting INTEGER,
    northing INTEGER,
    CONSTRAINT pk_sls_telemetry_station_id PRIMARY KEY (telemetry_station_id),
    CONSTRAINT unique_station UNIQUE (station_reference, region)
);

-- Create the sls_telemetry_value table
CREATE TABLE IF NOT EXISTS u_flood.sls_telemetry_value (
    telemetry_value_id BIGSERIAL NOT NULL,
    telemetry_value_parent_id BIGINT NOT NULL,
    value NUMERIC,
    processed_value NUMERIC,
    value_timestamp TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    error BOOLEAN NOT NULL,
    CONSTRAINT pk_sls_telemetry_value_id PRIMARY KEY (telemetry_value_id)
);

-- Create the sls_telemetry_value_parent table
CREATE TABLE IF NOT EXISTS u_flood.sls_telemetry_value_parent (
    telemetry_value_parent_id BIGSERIAL NOT NULL,
    filename TEXT NOT NULL,
    imported TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    rloi_id INTEGER NOT NULL,
    station TEXT NOT NULL,
    region TEXT NOT NULL,
    start_timestamp TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    end_timestamp TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    parameter TEXT NOT NULL,
    qualifier TEXT,
    units TEXT NOT NULL,
    post_process BOOLEAN,
    subtract NUMERIC(6,3),
    por_max_value NUMERIC(6,3),
    station_type CHARACTER(100),
    percentile_5 NUMERIC(6,3),
    data_type TEXT,
    period TEXT,
    CONSTRAINT pk_sls_telemetry_value_parent_id PRIMARY KEY (telemetry_value_parent_id)
);

-- Create the station_imtd_threshold table
CREATE TABLE IF NOT EXISTS u_flood.station_imtd_threshold (
    station_threshold_id BIGSERIAL NOT NULL,
    station_id BIGINT NOT NULL,
    fwis_code TEXT NOT NULL,
    fwis_type CHARACTER(100) NOT NULL,
    direction CHARACTER(100) NOT NULL,
    value NUMERIC NOT NULL,
    CONSTRAINT pk_station_imtd_threshold_id PRIMARY KEY (station_threshold_id)
);

-- Create the station_ta_8km table
CREATE TABLE IF NOT EXISTS u_flood.station_ta_8km (
    rloi_id INTEGER,
    fws_tacode TEXT
);

-- Create the station_ta_8km_2 table
CREATE TABLE IF NOT EXISTS u_flood.station_ta_8km_2 (
    rloi_id INTEGER,
    fws_tacode TEXT
);

-- Create the station_ta_8km_20220223_backup table
CREATE TABLE IF NOT EXISTS u_flood.station_ta_8km_20220223_backup (
    rloi_id INTEGER,
    fws_tacode TEXT
);

-- Create the station_ta_8km_20220512_backup table
CREATE TABLE IF NOT EXISTS u_flood.station_ta_8km_20220512_backup (
    rloi_id INTEGER,
    fws_tacode TEXT
);

-- Create the station_ta_8km_20220512 table
CREATE TABLE IF NOT EXISTS u_flood.station_ta_8km_20220512 (
    rloi_id INTEGER,
    fws_tacode TEXT
);

CREATE TABLE IF NOT EXISTS u_flood.telemetry_context
(
    telemetry_context_id bigint NOT NULL DEFAULT nextval('telemetry_context_telemetry_context_id_seq'::regclass),
    telemetry_id text COLLATE pg_catalog."default",
    wiski_id text COLLATE pg_catalog."default",
    rloi_id integer,
    station_type character(1) COLLATE pg_catalog."default",
    post_process boolean,
    subtract numeric,
    region text COLLATE pg_catalog."default",
    area text COLLATE pg_catalog."default",
    catchment text COLLATE pg_catalog."default",
    display_region text COLLATE pg_catalog."default",
    display_area text COLLATE pg_catalog."default",
    display_catchment text COLLATE pg_catalog."default",
    agency_name text COLLATE pg_catalog."default",
    external_name text COLLATE pg_catalog."default",
    location_info text COLLATE pg_catalog."default",
    x_coord_actual integer,
    y_coord_actual integer,
    actual_ngr text COLLATE pg_catalog."default",
    x_coord_display integer,
    y_coord_display integer,
    site_max numeric,
    wiski_river_name text COLLATE pg_catalog."default",
    date_open date,
    stage_datum numeric,
    period_of_record text COLLATE pg_catalog."default",
    por_max_value numeric,
    date_por_max timestamp with time zone,
    highest_level numeric,
    date_highest_level timestamp with time zone,
    por_min_value numeric,
    date_por_min timestamp with time zone,
    percentile_5 numeric,
    percentile_95 numeric,
    comments text COLLATE pg_catalog."default",
    d_stage_datum numeric,
    d_period_of_record text COLLATE pg_catalog."default",
    d_por_max_value numeric,
    d_date_por_max timestamp with time zone,
    d_highest_level numeric,
    d_date_highest_level timestamp with time zone,
    d_por_min_value numeric,
    d_date_por_min timestamp with time zone,
    d_percentile_5 numeric,
    d_percentile_95 numeric,
    d_comments text COLLATE pg_catalog."default",
    status text COLLATE pg_catalog."default",
    status_reason text COLLATE pg_catalog."default",
    status_date timestamp with time zone,
    CONSTRAINT pk_telemetry_context PRIMARY KEY (telemetry_context_id)
);

-- Create the sls_telemetry_value table
CREATE TABLE IF NOT EXISTS sls_telemetry_value (
    telemetry_value_id BIGSERIAL NOT NULL,
    telemetry_value_parent_id BIGINT NOT NULL,
    value NUMERIC,
    processed_value NUMERIC,
    value_timestamp TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    error BOOLEAN NOT NULL,
    CONSTRAINT pk_sls_telemetry_value_id PRIMARY KEY (telemetry_value_id)
);

CREATE TABLE IF NOT EXISTS telemetry_context
(
    telemetry_context_id bigint NOT NULL DEFAULT nextval('telemetry_context_telemetry_context_id_seq'::regclass),
    telemetry_id text COLLATE pg_catalog."default",
    wiski_id text COLLATE pg_catalog."default",
    rloi_id integer,
    station_type character(1) COLLATE pg_catalog."default",
    post_process boolean,
    subtract numeric,
    region text COLLATE pg_catalog."default",
    area text COLLATE pg_catalog."default",
    catchment text COLLATE pg_catalog."default",
    display_region text COLLATE pg_catalog."default",
    display_area text COLLATE pg_catalog."default",
    display_catchment text COLLATE pg_catalog."default",
    agency_name text COLLATE pg_catalog."default",
    external_name text COLLATE pg_catalog."default",
    location_info text COLLATE pg_catalog."default",
    x_coord_actual integer,
    y_coord_actual integer,
    actual_ngr text COLLATE pg_catalog."default",
    x_coord_display integer,
    y_coord_display integer,
    site_max numeric,
    wiski_river_name text COLLATE pg_catalog."default",
    date_open date,
    stage_datum numeric,
    period_of_record text COLLATE pg_catalog."default",
    por_max_value numeric,
    date_por_max timestamp with time zone,
    highest_level numeric,
    date_highest_level timestamp with time zone,
    por_min_value numeric,
    date_por_min timestamp with time zone,
    percentile_5 numeric,
    percentile_95 numeric,
    comments text COLLATE pg_catalog."default",
    d_stage_datum numeric,
    d_period_of_record text COLLATE pg_catalog."default",
    d_por_max_value numeric,
    d_date_por_max timestamp with time zone,
    d_highest_level numeric,
    d_date_highest_level timestamp with time zone,
    d_por_min_value numeric,
    d_date_por_min timestamp with time zone,
    d_percentile_5 numeric,
    d_percentile_95 numeric,
    d_comments text COLLATE pg_catalog."default",
    status text COLLATE pg_catalog."default",
    status_reason text COLLATE pg_catalog."default",
    status_date timestamp with time zone,
    CONSTRAINT pk_telemetry_context PRIMARY KEY (telemetry_context_id)
);



-- Create the imtd_niki table
CREATE TABLE IF NOT EXISTS imtd_niki (
    station_threshold_id BIGINT DEFAULT nextval('station_imtd_threshold_station_threshold_id_seq'::regclass) NOT NULL,
    station_id BIGINT NOT NULL,
    fwis_code TEXT NOT NULL,
    fwis_type CHARACTER(100) NOT NULL,
    direction CHARACTER(100) NOT NULL,
    value NUMERIC NOT NULL,
    CONSTRAINT pk_station_imtd_threshold PRIMARY KEY (station_threshold_id)
);

-- Create the river table
CREATE TABLE IF NOT EXISTS river (
    id CHARACTER VARYING(200) NOT NULL,
    name CHARACTER VARYING(200),
    qualified_name CHARACTER VARYING(250),
    PRIMARY KEY (id)
);

-- Create the river_display table
CREATE TABLE IF NOT EXISTS river_display (
    id INTEGER,
    local_name CHARACTER VARYING,
    qualified_name CHARACTER VARYING,
    river_id CHARACTER VARYING
);

-- Create the river_display_name table
CREATE TABLE IF NOT EXISTS river_display_name (
    river_id TEXT,
    display TEXT
);

-- Create the river_stations table
CREATE TABLE IF NOT EXISTS river_stations (
    river_id CHARACTER VARYING(200),
    rloi_id INTEGER,
    rank INTEGER
);

-- Create the river_stations_list_test table
CREATE TABLE IF NOT EXISTS river_stations_list_test (
    id CHARACTER VARYING(200),
    name CHARACTER VARYING(200),
    rloi_id INTEGER,
    rank INTEGER,
    display_name TEXT
);

CREATE TABLE IF NOT EXISTS test_biz_mak (
    id CHARACTER VARYING(200),
    name CHARACTER VARYING(200),
    rloi_id INTEGER,
    rank INTEGER,
    display_name TEXT
);


CREATE TABLE IF NOT EXISTS u_flood.mock1 (
    gid INTEGER,
    name TEXT,
    value NUMERIC
);

INSERT INTO u_flood.mock1 (gid, name, value) VALUES
    (1, 'mock1_name1', 123.45),
    (2, 'mock1_name2', 234.56),
    (3, 'mock1_name3', 345.67);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.telemetry_context_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS tcmindex ON u_flood.telemetry_context_mview (gid);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.station_split_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS ssmindex ON u_flood.station_split_mview (gid);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.stations_overview_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS soindex ON u_flood.stations_overview_mview (gid);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.impact_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS imindex ON u_flood.impact_mview (gid);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.rivers_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS rmindex ON u_flood.rivers_mview (gid);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.rainfall_stations_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS rsindex ON u_flood.rainfall_stations_mview (gid);

CREATE MATERIALIZED VIEW IF NOT EXISTS u_flood.stations_list_mview AS SELECT * FROM u_flood.mock1;
CREATE UNIQUE INDEX IF NOT EXISTS slindex ON u_flood.stations_list_mview (gid);
