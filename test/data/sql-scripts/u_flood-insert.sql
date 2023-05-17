-- Insert data into current_load_timestamp table
INSERT INTO u_flood.current_load_timestamp (id, load_timestamp) VALUES (1, 1621820287000);

-- Insert data into databasechangelog table
INSERT INTO u_flood.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id)
VALUES ('1', 'user', 'changelog.sql', '2023-05-22 10:30:00', 1, 'EXECUTED', 'md5sum123', 'Initial schema', '', '', '3.10.2', '', '', '123456');

-- Insert data into databasechangeloglock table
INSERT INTO u_flood.databasechangeloglock (id, locked, lockgranted, lockedby) VALUES (1, true, '2023-05-22 10:30:00', 'user');

-- Insert data into england_010k table
INSERT INTO u_flood.england_010k (gid, region_id, reg_name, reg_prop_n, reg_addr_1, reg_addr_2, reg_town, reg_pcode, geom)
VALUES (1, 12345, 'Region 1', 'Property 1', 'Address 1', 'Address 2', 'Town 1', 'PCode 1', 'POINT(1 1)'),
(2, 54321, 'Region 2', 'Property 2', 'Address 3', 'Address 4', 'Town 2', 'PCode 2', 'POINT(2 2)');

-- Insert data into ffoi_max table
INSERT INTO u_flood.ffoi_max (telemetry_id, value, value_date, filename, updated_date)
VALUES ('telemetry1', 10.5, '2023-05-22 12:00:00', 'file1.txt', '2023-05-22 12:05:00'),
('telemetry2', 8.2, '2023-05-22 13:00:00', 'file2.txt', '2023-05-22 13:10:00');

-- Insert data into ffoi_station table
INSERT INTO u_flood.ffoi_station (ffoi_station_id, rloi_id)
VALUES (1, 1001),
(2, 1002);

-- Insert data into ffoi_station_threshold table
INSERT INTO u_flood.ffoi_station_threshold (ffoi_station_threshold_id, ffoi_station_id, fwis_code, value)
VALUES (1, 1, 'FWIS001', 10),
(2, 1, 'FWIS002', 5),
(3, 2, 'FWIS001', 8);

-- Insert data into flood_alert_area table
INSERT INTO u_flood.flood_alert_area (gid, area, fws_tacode, ta_name, descrip, la_name, qdial, river_sea, geom)
VALUES (1, 'Area 1', 'TACODE001', 'TA Name 1', 'Description 1', 'LA Name 1', 'QDIAL001', 'River', 'POLYGON((0 0, 1 1, 1 0, 0 0))'),
(2, 'Area 2', 'TACODE002', 'TA Name 2', 'Description 2', 'LA Name 2', 'QDIAL002', 'Sea', 'POLYGON((1 1, 2 2, 2 1, 1 1))');

-- Insert data into flood_alert_area_2 table
INSERT INTO u_flood.flood_alert_area_2 (gid, area, fws_tacode, ta_name, descrip, la_name, qdial, river_sea, geom)
VALUES (1, 'Area 1', 'TACODE001', 'TA Name 1', 'Description 1', 'LA Name 1', 'QDIAL001', 'River', 'POLYGON((0 0, 1 1, 1 0, 0 0))'),
(2, 'Area 2', 'TACODE002', 'TA Name 2', 'Description 2', 'LA Name 2', 'QDIAL002', 'Sea', 'POLYGON((1 1, 2 2, 2 1, 1 1))');

-- Insert data into flood_warning_area table
INSERT INTO u_flood.flood_warning_area (gid, area, fws_tacode, ta_name, descrip, la_name, parent, qdial, river_sea, geom)
VALUES (1, 'Area 1', 'TACODE001', 'TA Name 1', 'Description 1', 'LA Name 1', 'Parent 1', 'QDIAL001', 'River', 'POLYGON((0 0, 1 1, 1 0, 0 0))'),
(2, 'Area 2', 'TACODE002', 'TA Name 2', 'Description 2', 'LA Name 2', 'Parent 2', 'QDIAL002', 'Sea', 'POLYGON((1 1, 2 2, 2 1, 1 1))');

-- Insert data into fwis table
INSERT INTO u_flood.fwis (id, situation, ta_id, ta_code, ta_name, ta_description, quick_dial, ta_version, ta_category, owner_area, ta_created_date, ta_modified_date, situation_changed, severity_changed, message_received, severity_value, severity)
VALUES (1, 'Situation 1', 1001, 'TACODE001', 'TA Name 1', 'TA Description 1', 123, 1, 'Category 1', 'Owner Area 1', '2023-05-22 10:00:00', '2023-05-22 11:00:00', '2023-05-22 10:30:00', '2023-05-22 10:45:00', '2023-05-22 10:50:00', 1, 'Low'),
(2, 'Situation 2', 1002, 'TACODE002', 'TA Name 2', 'TA Description 2', 456, 1, 'Category 2', 'Owner Area 2', '2023-05-22 11:00:00', '2023-05-22 12:00:00', '2023-05-22 11:30:00', '2023-05-22 11:45:00', '2023-05-22 11:50:00', 2, 'Medium');

-- Insert data into impact table
INSERT INTO u_flood.impact (id, rloi_id, value, units, comment, short_name, description, type, obs_flood_year, obs_flood_month, source, lat, lng, geom)
VALUES (1, 1001, 10.5, 'cm', 'Impact comment 1', 'Short Name 1', 'Impact Description 1', 'Type 1', '2022', 'January', 'Source 1', 52.123, -1.456, 'POINT(1 1)'),
(2, 1002, 8.2, 'cm', 'Impact comment 2', 'Short Name 2', 'Impact Description 2', 'Type 2', '2022', 'February', 'Source 2', 53.789, -2.345, 'POINT(2 2)');

-- Insert data into sls_telemetry_station table
INSERT INTO u_flood.sls_telemetry_station (telemetry_station_id, station_reference, region, station_name, ngr, easting, northing)
VALUES (1, 'StationRef1', 'Region 1', 'Station Name 1', 'NGR1', 100000, 200000),
(2, 'StationRef2', 'Region 2', 'Station Name 2', 'NGR2', 200000, 300000);

-- Insert data into sls_telemetry_value_parent table
INSERT INTO u_flood.sls_telemetry_value_parent (telemetry_value_parent_id, filename, imported, rloi_id, station, region, start_timestamp, end_timestamp, parameter, qualifier, units, post_process, subtract, por_max_value, station_type, percentile_5, data_type, period)
VALUES (1, 'file1.txt', '2023-05-22 10:00:00', 1001, 'StationRef1', 'Region 1', '2023-05-22 10:00:00', '2023-05-22 11:00:00', 'Parameter 1', 'Qualifier 1', 'Units 1', false, 0.0, 100.0, 'Type 1', 5.0, 'Data Type 1', 'Period 1'),
(2, 'file2.txt', '2023-05-22 11:00:00', 1002, 'StationRef2', 'Region 2', '2023-05-22 11:00:00', '2023-05-22 12:00:00', 'Parameter 2', 'Qualifier 2', 'Units 2', true, 1.0, 200.0, 'Type 2', 10.0, 'Data Type 2', 'Period 2');

-- Insert data into sls_telemetry_value table
INSERT INTO u_flood.sls_telemetry_value (telemetry_value_id, telemetry_value_parent_id, value, processed_value, value_timestamp, error)
VALUES (1, 1, 10.5, 10.0, '2023-05-22 10:30:00', false),
(2, 1, 8.2, 8.0, '2023-05-22 10:45:00', false),
(3, 2, 15.3, 14.5, '2023-05-22 11:15:00', false);

-- Insert data into station_imtd_threshold table
INSERT INTO u_flood.station_imtd_threshold (station_threshold_id, station_id, fwis_code, fwis_type, direction, value)
VALUES (1, 1001, 'FWIS001', 'A', 'D', 10.5),
(2, 1002, 'FWIS002', 'B', 'I', 8.2);

-- Insert data into river table
INSERT INTO u_flood.river (id, name, qualified_name)
VALUES ('river1', 'River 1', 'Qualified Name 1'),
('river2', 'River 2', 'Qualified Name 2');

-- Insert data into river_display table
INSERT INTO u_flood.river_display (id, local_name, qualified_name, river_id)
VALUES (1, 'Local Name 1', 'Qualified Name 1', 'river1'),
(2, 'Local Name 2', 'Qualified Name 2', 'river2');

-- Insert data into river_display_name table
INSERT INTO u_flood.river_display_name (river_id, display)
VALUES ('river1', 'Display Name 1'),
('river2', 'Display Name 2');

-- Insert data into river_stations table
INSERT INTO u_flood.river_stations (river_id, rloi_id, rank)
VALUES ('river1', 1001, 1),
('river2', 1002, 2);

-- Insert data into river_stations_list_test table
INSERT INTO u_flood.river_stations_list_test (id, name, rloi_id, rank, display_name)
VALUES ('river1', 'River 1', 1001, 1, 'Display Name 1'),
('river2', 'River 2', 1002, 2, 'Display Name 2');

-- Insert data into imtd_niki table
INSERT INTO u_flood.imtd_niki (station_threshold_id, station_id, fwis_code, fwis_type, direction, value)
VALUES (1, 1001, 'FWIS001', 'A', 'D', 10.5),
(2, 1002, 'FWIS002', 'B', 'I', 8.2);

-- current_load_timestamp
INSERT INTO current_load_timestamp (id, load_timestamp) VALUES (1, 1621820287000);

-- databasechangelog
INSERT INTO databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id)
VALUES ('1', 'user', 'changelog.sql', '2023-05-22 10:30:00', 1, 'EXECUTED', 'md5sum123', 'Initial schema', '', '', '3.10.2', '', '', '123456');

-- databasechangeloglock
INSERT INTO databasechangeloglock (id, locked, lockgranted, lockedby) VALUES (1, true, '2023-05-22 10:30:00', 'user');

-- england_010k
INSERT INTO england_010k (gid, region_id, reg_name, reg_prop_n, reg_addr_1, reg_addr_2, reg_town, reg_pcode, geom)
VALUES (1, 12345, 'Region 1', 'Property 1', 'Address 1', 'Address 2', 'Town 1', 'PCode 1', 'POINT(1 1)'),
(2, 54321, 'Region 2', 'Property 2', 'Address 3', 'Address 4', 'Town 2', 'PCode 2', 'POINT(2 2)');

-- ffoi_max
INSERT INTO ffoi_max (telemetry_id, value, value_date, filename, updated_date)
VALUES ('telemetry1', 10.5, '2023-05-22 12:00:00', 'file1.txt', '2023-05-22 12:05:00'),
('telemetry2', 8.2, '2023-05-22 13:00:00', 'file2.txt', '2023-05-22 13:10:00');

-- ffoi_station
INSERT INTO ffoi_station (ffoi_station_id, rloi_id)
VALUES (1, 1001),
(2, 1002);

-- ffoi_station_threshold
INSERT INTO ffoi_station_threshold (ffoi_station_threshold_id, ffoi_station_id, fwis_code, value)
VALUES (1, 1, 'FWIS001', 10),
(2, 1, 'FWIS002', 5),
(3, 2, 'FWIS001', 8);

-- flood_alert_area
INSERT INTO flood_alert_area (gid, area, fws_tacode, ta_name, descrip, la_name, qdial, river_sea, geom)
VALUES (1, 'Area 1', 'TACODE001', 'TA Name 1', 'Description 1', 'LA Name 1', 'QDIAL001', 'River', 'POLYGON((0 0, 1 1, 1 0, 0 0))'),
(2, 'Area 2', 'TACODE002', 'TA Name 2', 'Description 2', 'LA Name 2', 'QDIAL002', 'Sea', 'POLYGON((1 1, 2 2, 2 1, 1 1))');

-- flood_alert_area_2
INSERT INTO flood_alert_area_2 (gid, area, fws_tacode, ta_name, descrip, la_name, qdial, river_sea, geom)
VALUES (1, 'Area 1', 'TACODE001', 'TA Name 1', 'Description 1', 'LA Name 1', 'QDIAL001', 'River', 'POLYGON((0 0, 1 1, 1 0, 0 0))'),
(2, 'Area 2', 'TACODE002', 'TA Name 2', 'Description 2', 'LA Name 2', 'QDIAL002', 'Sea', 'POLYGON((1 1, 2 2, 2 1, 1 1))');

-- flood_warning_area
INSERT INTO flood_warning_area (gid, area, fws_tacode, ta_name, descrip, la_name, parent, qdial, river_sea, geom)
VALUES (1, 'Area 1', 'TACODE001', 'TA Name 1', 'Description 1', 'LA Name 1', 'Parent 1', 'QDIAL001', 'River', 'POLYGON((0 0, 1 1, 1 0, 0 0))'),
(2, 'Area 2', 'TACODE002', 'TA Name 2', 'Description 2', 'LA Name 2', 'Parent 2', 'QDIAL002', 'Sea', 'POLYGON((1 1, 2 2, 2 1, 1 1))');

-- fwis
INSERT INTO fwis (id, situation, ta_id, ta_code, ta_name, ta_description, quick_dial, ta_version, ta_category, owner_area, ta_created_date, ta_modified_date, situation_changed, severity_changed, message_received, severity_value, severity)
VALUES (1, 'Situation 1', 1001, 'TACODE001', 'TA Name 1', 'TA Description 1', 123, 1, 'Category 1', 'Owner Area 1', '2023-05-22 10:00:00', '2023-05-22 11:00:00', '2023-05-22 10:30:00', '2023-05-22 10:45:00', '2023-05-22 10:50:00', 1, 'Low'),
(2, 'Situation 2', 1002, 'TACODE002', 'TA Name 2', 'TA Description 2', 456, 1, 'Category 2', 'Owner Area 2', '2023-05-22 11:00:00', '2023-05-22 12:00:00', '2023-05-22 11:30:00', '2023-05-22 11:45:00', '2023-05-22 11:50:00', 2, 'Medium');

-- impact
INSERT INTO impact (id, rloi_id, value, units, comment, short_name, description, type, obs_flood_year, obs_flood_month, source, lat, lng, geom)
VALUES (1, 1001, 10.5, 'cm', 'Impact comment 1', 'Short Name 1', 'Impact Description 1', 'Type 1', '2022', 'January', 'Source 1', 52.123, -1.456, 'POINT(1 1)'),
(2, 1002, 8.2, 'cm', 'Impact comment 2', 'Short Name 2', 'Impact Description 2', 'Type 2', '2022', 'February', 'Source 2', 53.789, -2.345, 'POINT(2 2)');

-- sls_telemetry_station
INSERT INTO sls_telemetry_station (telemetry_station_id, station_reference, region, station_name, ngr, easting, northing)
VALUES (1, 'StationRef1', 'Region 1', 'Station Name 1', 'NGR1', 100000, 200000),
(2, 'StationRef2', 'Region 2', 'Station Name 2', 'NGR2', 200000, 300000);

-- sls_telemetry_value_parent
INSERT INTO sls_telemetry_value_parent (telemetry_value_parent_id, filename, imported, rloi_id, station, region, start_timestamp, end_timestamp, parameter, qualifier, units, post_process, subtract, por_max_value, station_type, percentile_5, data_type, period)
VALUES (1, 'file1.txt', '2023-05-22 10:00:00', 1001, 'StationRef1', 'Region 1', '2023-05-22 10:00:00', '2023-05-22 11:00:00', 'Parameter 1', 'Qualifier 1', 'Units 1', false, 0.0, 100.0, 'Type 1', 5.0, 'Data Type 1', 'Period 1'),
(2, 'file2.txt', '2023-05-22 11:00:00', 1002, 'StationRef2', 'Region 2', '2023-05-22 11:00:00', '2023-05-22 12:00:00', 'Parameter 2', 'Qualifier 2', 'Units 2', true, 1.0, 200.0, 'Type 2', 10.0, 'Data Type 2', 'Period 2');

-- sls_telemetry_value
INSERT INTO sls_telemetry_value (telemetry_value_id, telemetry_value_parent_id, value, processed_value, value_timestamp, error)
VALUES (1, 1, 10.5, 10.0, '2023-05-22 10:30:00', false),
(2, 1, 8.2, 8.0, '2023-05-22 10:45:00', false),
(3, 2, 15.3, 14.5, '2023-05-22 11:15:00', false);

-- station_imtd_threshold
INSERT INTO station_imtd_threshold (station_threshold_id, station_id, fwis_code, fwis_type, direction, value)
VALUES (1, 1001, 'FWIS001', 'A', 'D', 10.5),
(2, 1002, 'FWIS002', 'B', 'I', 8.2);

-- river
INSERT INTO river (id, name, qualified_name)
VALUES ('river1', 'River 1', 'Qualified Name 1'),
('river2', 'River 2', 'Qualified Name 2');

-- river_display
INSERT INTO river_display (id, local_name, qualified_name, river_id)
VALUES (1, 'Local Name 1', 'Qualified Name 1', 'river1'),
(2, 'Local Name 2', 'Qualified Name 2', 'river2');

-- river_display_name
INSERT INTO river_display_name (river_id, display)
VALUES ('river1', 'Display Name 1'),
('river2', 'Display Name 2');

-- river_stations
INSERT INTO river_stations (river_id, rloi_id, rank)
VALUES ('river1', 1001, 1),
('river2', 1002, 2);

-- river_stations_list_test
INSERT INTO river_stations_list_test (id, name, rloi_id, rank, display_name)
VALUES ('river1', 'River 1', 1001, 1, 'Display Name 1'),
('river2', 'River 2', 1002, 2, 'Display Name 2');

-- imtd_niki
INSERT INTO imtd_niki (station_threshold_id, station_id, fwis_code, fwis_type, direction, value)
VALUES (1, 1001, 'FWIS001', 'A', 'D', 10.5),(2, 1002, 'FWIS002', 'B', 'I', 8.2);
