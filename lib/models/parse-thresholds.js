const thresholdTypeFilter = (thresholdType) => {
  // https://eaflood.atlassian.net/browse/FSR-595?focusedCommentId=425005
  const includedThresholdTypes = [
    'FW ACT FW',
    'FW ACTCON FW',
    'FW RES FW',
    'FW ACT FAL',
    'FW ACTCON FAL',
    'FW RES FAL'
  ]
  return includedThresholdTypes.includes(thresholdType)
}

const data =
  {
    Parameter: 'Level',
    qualifier: 'Stage',
    Unit: 'mALD',
    DisplayTimeSeries: false,
    Thresholds: [
      {
        ThresholdType: 'INFO RLOI PORMIN',
        Level: 0.322,
        FloodWarningArea: null
      },
      {
        ThresholdType: 'INFO RLOI PERCENT95',
        Level: 0.417,
        FloodWarningArea: null
      },
      {
        ThresholdType: 'FW RES FAL',
        Level: 3.95,
        FloodWarningArea: '031WAF108'
      },
      {
        ThresholdType: 'INFO RLOI OTH',
        Level: 4.0,
        FloodWarningArea: null
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 4.5,
        FloodWarningArea: '031FWFSE485'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 4.6,
        FloodWarningArea: '031FWFSE505'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 4.7,
        FloodWarningArea: '031FWFSE475'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 4.85,
        FloodWarningArea: '031FWFSE480'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 5.0,
        FloodWarningArea: '031FWFSE490'
      },
      {
        ThresholdType: 'FW ACTCON FW',
        Level: 5.1,
        FloodWarningArea: '031FWFSE510'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 5.1,
        FloodWarningArea: '031FWFSE470'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 5.2,
        FloodWarningArea: '031FWFSE495'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 5.7,
        FloodWarningArea: '031FWFSE500'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 5.9,
        FloodWarningArea: '031FWFSE515'
      },
      {
        ThresholdType: 'INFO RLOI PORMAX',
        Level: 5.925,
        FloodWarningArea: null
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 5.95,
        FloodWarningArea: '031FWFSE485'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 6.0,
        FloodWarningArea: '031FWFSE505'
      },
      {
        ThresholdType: 'FW RES FW',
        Level: 6.1,
        FloodWarningArea: '031FWFSE535'
      }
    ]
  }

const parseThresholds = (data) => {
  const thresholds = data
    .filter(element => element.Parameter !== 'Flow')
    .map(element => {
      return element.Thresholds
        .filter(threshold => thresholdTypeFilter(threshold.ThresholdType))
        .map(threshold => {
          return {
            floodWarningArea: threshold.FloodWarningArea,
            floodWarningType: threshold.FloodWarningArea[4],
            direction: element.qualifier === 'Downstream Stage' ? 'd' : 'u',
            level: threshold.Level
          }
        })
    })
  return thresholds.flat()
}

// Note: this function determines the minimum threshold level for a given station id, direction (u|d) and type (A|W)
// It is not currently used
// If we decide that we only need to persist the minimum thresholds (as opposed to all alert/warning levels)
// then this is available. This is likely to be when we move the API injest to a lambda function
const getMinThresholds = (data) => {
  const thresholds = parseThresholds(data)

  const getMin = (thresholds, direction, type) => {
    const levels = thresholds
      .filter(t => t.direction === direction && t.floodWarningType.toLowerCase() === type)
      .map(t => t.level)
    return levels.length > 0 ? Math.min(...levels) : null
  }

  return {
    downstream: {
      alert: getMin(thresholds, 'd', 'a'),
      warning: getMin(thresholds, 'd', 'w')
    },
    upstream: {
      alert: getMin(thresholds, 'u', 'a'),
      warning: getMin(thresholds, 'u', 'w')
    }
  }
}

module.exports = {
  parseThresholds,
  getMinThresholds
}
