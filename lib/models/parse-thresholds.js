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
