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



