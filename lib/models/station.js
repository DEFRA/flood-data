const util = require('../helpers/util')

module.exports = {
  async saveToObjects(stations, bucket, s3) {
    const params = {
      Body: JSON.stringify(stations),
      Bucket: bucket,
      Key: 'rloi/stations.json'
    }
    await s3.putObject(params)
    console.log(`${params.Key} uploaded`)
    const count = stations.length
    let uploaded = 0

    console.log(`${count} stations to load`)

    await Promise.all(stations.map(async station => {
      uploaded++
      try {
        await s3.putObject({
          Body: JSON.stringify(station),
          Bucket: bucket,
          Key: `rloi/${station.Region}/${station.Telemetry_ID}/station.json`
        })
      } catch (err) {
        console.log(`Failed to upload(${uploaded}/${count}): ${params.Key}`)
        console.error(err)
      }
    }))
    console.log('Stations processed')
  },

  async saveToDb(stations, pool) {
    const dbStations = stations.map(station => ({
      telemetry_id: station.Telemetry_ID,
      wiski_id: station.WISKI_ID,
      station_type: station.Station_Type,
      post_process: station.Post_Process,
      region: station.Region,
      area: station.Area,
      catchment: station.Catchment,
      display_region: station.Display_Region,
      display_area: station.Display_Area,
      display_catchment: station.Display_Catchment,
      agency_name: station.Agency_Name,
      external_name: station.External_Name,
      location_info: station.Location_Info,
      actual_ngr: station.Actual_NGR,
      comments: station.Comments,
      d_comments: station.D_Comments,
      d_period_of_record: station.D_Period_of_Record,
      status: station.Status,
      status_reason: station.Status_Reason,
      period_of_record: station.Period_of_Record,
      wiski_river_name: station.Wiski_River_Name,
      rloi_id: util.parseIntNull(station.RLOI_ID, 10),
      subtract: util.parseFloatNull(station.Subtract),
      x_coord_actual: util.parseIntNull(station.X_coord_Actual, 10),
      y_coord_actual: util.parseIntNull(station.Y_Coord_Actual, 10),
      x_coord_display: util.parseIntNull(station.X_coord_Display, 10),
      y_coord_display: util.parseIntNull(station.Y_coord_Display, 10),
      site_max: util.parseFloatNull(station.Site_Max),
      stage_datum: util.parseFloatNull(station.Stage_Datum),
      por_max_value: util.parseFloatNull(station.POR_Max_Value),
      highest_level: util.parseFloatNull(station.Highest_Level),
      por_min_value: util.parseFloatNull(station.POR_Min_Value),
      percentile_5: util.parseFloatNull(station.percentile_5),
      percentile_95: util.parseFloatNull(station.percentile_95),
      d_stage_datum: util.parseFloatNull(station.D_Stage_Datum),
      d_por_max_value: util.parseFloatNull(station.D_POR_Max_Value),
      d_highest_level: util.parseFloatNull(station.D_Highest_Level),
      d_percentile_5: util.parseFloatNull(station.D_percentile_5),
      d_percentile_95: util.parseFloatNull(station.D_percentile_95),
      d_por_min_value: util.parseFloatNull(station.D_POR_Min_Value),
      d_date_por_min: util.toUtcDateStringOrNull(station.D_Date_POR_Min),
      d_date_por_max: util.toUtcDateStringOrNull(station.D_Date_POR_Max),
      d_date_highest_level: util.toUtcDateStringOrNull(station.D_Date_Highest_Level),
      date_open: util.toUtcDateStringOrNull(station.Date_Open),
      date_por_min: util.toUtcDateStringOrNull(station.Date_POR_Min),
      date_por_max: util.toUtcDateStringOrNull(station.Date_POR_Max),
      date_highest_level: util.toUtcDateStringOrNull(station.Date_Highest_Level),
      status_date: util.toUtcDateStringOrNull(station.Status_Date)
    }))

    // Clear out stations
    await pool.query('deleteStations')
    console.log('Cleared previous station records.')

    const batchSize = 500
    const total = dbStations.length
    const totalBatches = Math.ceil(total / batchSize)

    for (let i = 0; i < totalBatches; i++) {
      const batch = dbStations.slice(i * batchSize, (i + 1) * batchSize)

      console.log(`🚚 Inserting batch ${i + 1} of ${totalBatches} (${batch.length} records)`)

      try {
        await pool.query('insertStations', batch)
      } catch (err) {
        console.error(`❌ Failed inserting batch ${i + 1}: ${err.message}`)

        // Print the first few rows to help isolate the bad row
        batch.slice(0, 3).forEach((r, idx) => {
          console.error(`Row ${idx + 1}:`, JSON.stringify(r, null, 2))
        })

        // Check for suspicious values
        for (const [index, row] of batch.entries()) {
          if (
            Object.values(row).some(v =>
              typeof v === 'string' && (v.toLowerCase?.() === 'nan' || v.includes('NaN'))
            )
          ) {
            console.error(`⚠️ NaN or stringified NaN in row ${index + 1}:`, JSON.stringify(row))
          }
        }

        throw err
      }
    }

    console.log(`✅ All ${total} stations inserted.`)

    await this.refreshStationMview(pool)
    console.log('Refreshed materialised views.')
  },

  async refreshStationMview(pool) {
    await pool.query('refreshStationMviews')
    console.log('Materialised views refreshed.')
  }
}
