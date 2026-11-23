const parseTimeSeries = require('../../../lib/models/parse-time-series')

describe('parseTimeSeries', () => {
  it('returns an empty object when there is no data', () => {
    expect(parseTimeSeries(undefined, 1)).toEqual({})
  })

  it('maps directions and removes duplicates', () => {
    const data = [
      { qualifier: 'Downstream Stage', DisplayTimeSeries: true },
      { qualifier: 'Downstream Stage', DisplayTimeSeries: false },
      { qualifier: 'Stage', DisplayTimeSeries: true }
    ]
    expect(parseTimeSeries(data, 5)).toEqual([
      { station_id: 5, direction: 'd', display_time_series: true },
      { station_id: 5, direction: 'u', display_time_series: true }
    ])
  })
})
