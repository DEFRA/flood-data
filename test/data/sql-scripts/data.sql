CREATE EXTENSION IF NOT EXISTS postgis;

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



