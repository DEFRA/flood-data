const Code = require('@hapi/code')
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const response = require('./data/imfs-simple-response.json')
const flowResponse = require('./data/imfs-flow-response.json')
const { parseThresholds } = require('../../../lib/models/parse-thresholds')

lab.experiment('parseThresholds tests', () => {
  lab.test('should parse thresholds from simple IMTD response', () => {
    const thresholds = parseThresholds(response[0].TimeSeriesMetaData)
    Code.expect(thresholds).to.be.an.array()
    Code.expect(thresholds.length).to.equal(3)
    Code.expect(thresholds).to.equal([
      {
        stationId: undefined,
        floodWarningArea: '033WAF309',
        floodWarningType: 'A',
        direction: 'd',
        level: 1.3
      },
      {
        stationId: undefined,
        floodWarningArea: '033FWF3TRENT04',
        floodWarningType: 'W',
        direction: 'd',
        level: 1.37
      },
      {
        stationId: undefined,
        floodWarningArea: '033FWF3TRENT04',
        floodWarningType: 'W',
        direction: 'd',
        level: 1.77
      }
    ])
  })
  lab.test('should parse thresholds from flow response', () => {
    const thresholds = parseThresholds(flowResponse[0].TimeSeriesMetaData)
    Code.expect(thresholds).to.be.an.array()
    Code.expect(thresholds.length).to.equal(16)
    // use the map to make the test more concise, consider whether this is better approach than in than test above
    Code.expect(thresholds.map(t => `2116,${t.floodWarningArea},${t.floodWarningType},${t.direction},${t.level}`)).to.equal([
      '2116,034WAF414,A,u,1.7',
      '2116,034WAF415,A,u,2.4',
      '2116,034WAF414,A,u,2.6',
      '2116,034WAF415,A,u,2.7',
      '2116,034FWFTRCAVBRDG,W,u,2.7',
      '2116,034FWFTRSWARKST,W,u,2.8',
      '2116,034FWFTRBARROW,W,u,2.95',
      '2116,034FWFTRCASDONKM,W,u,2.95',
      '2116,034FWFTRRPTING,W,u,2.95',
      '2116,034FWFTRTRENTLK,W,u,3.1',
      '2116,034FWFTRTHRMPTN,W,u,3.15',
      '2116,034FWFTRTWYFORD,W,u,3.15',
      '2116,034FWFTRSHARDLW,W,u,3.45',
      '2116,034FWFTRWLLNGTN,W,u,3.45',
      '2116,034FWFTRNEWSAWLY,W,u,3.5',
      '2116,034FWFTRSAWLEY,W,u,3.5'
    ])
  })

  lab.test('should parse thresholds where there are no thresholds returned (TODO)')
  // for example when there are no thresholds matching includedThresholdTypes
  // use null object pattern
  // this is just a fancy way of saying don't return null, always return an array of thresholds which may be empty

  lab.test('should parse thresholds where the response has an empty TimeSeriesMetaData (TODO)')
  lab.test('should parse thresholds where the response has no TimeSeriesMetaData (TODO)')
})
