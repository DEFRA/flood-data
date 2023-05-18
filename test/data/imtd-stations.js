const stations =
{
  rows: [
    {
      rloi_id: 1001
    },
    {
      rloi_id: 1006
    },
    {
      rloi_id: 1009
    },
    {
      rloi_id: 1010
    },
    {
      rloi_id: 1011
    },
    {
      rloi_id: 1013
    },
    {
      rloi_id: 1014
    },
    {
      rloi_id: 1017
    }
  ]
}

const apiResponse = {
  status: 200,
  statusText: 'OK',
  data: [
    {
      RLOIid: '1165',
      wiskiID: '254290001',
      telemetryID: 'E10023',
      Name: 'Tanbridge GS',
      TimeSeriesMetaData: [
        {
          Parameter: 'Level',
          qualifier: 'Stage',
          Unit: 'mAOD',
          DisplayTimeSeries: false,
          Thresholds: [
            {
              ThresholdType: 'INFO RLOI PORMIN',
              Level: 32.114,
              FloodWarningArea: null
            },
            {
              ThresholdType: 'INFO RLOI PERCENT95',
              Level: 32.15,
              FloodWarningArea: null
            },
            {
              ThresholdType: 'INFO RLOI OTH',
              Level: 32.6,
              FloodWarningArea: null
            },
            {
              ThresholdType: 'FW ACTCON FAL',
              Level: 33.4,
              FloodWarningArea: '065WAF423'
            },
            {
              ThresholdType: 'FW ACTCON FAL',
              Level: 33.9,
              FloodWarningArea: '065WAF423'
            },
            {
              ThresholdType: 'FW RES FAL',
              Level: 34.2,
              FloodWarningArea: '065WAF423'
            },
            {
              ThresholdType: 'FW ACTCON FW',
              Level: 34.4,
              FloodWarningArea: '065FWF5001'
            },
            {
              ThresholdType: 'FW ACT FW',
              Level: 34.9,
              FloodWarningArea: '065FWF5001'
            },
            {
              ThresholdType: 'INFO RLOI PORMAX',
              Level: 34.956,
              FloodWarningArea: null
            },
            {
              ThresholdType: 'FW RES FW',
              Level: 35.2,
              FloodWarningArea: '065FWF5001'
            }
          ]
        }
      ]
    }
  ]
}

module.exports = { stations, apiResponse }
