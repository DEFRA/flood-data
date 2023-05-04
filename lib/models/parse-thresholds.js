const thresholdTypeFilter = (thresholdType) => {
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

const parseThresholds = (data, station) => {
  return data
    .filter(({ Parameter }) => Parameter !== 'Flow')
    .flatMap(({ Thresholds, qualifier }) => {
      return Thresholds
        .filter(({ ThresholdType }) => thresholdTypeFilter(ThresholdType))
        .map(({ FloodWarningArea, Level }) => ({
          stationId: station,
          floodWarningArea: FloodWarningArea,
          floodWarningType: FloodWarningArea[4],
          direction: qualifier === 'Downstream Stage' ? 'd' : 'u',
          level: Level
        }))
    })
}

module.exports = {
  parseThresholds
}
