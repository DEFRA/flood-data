// const Lab = require('@hapi/lab')
// const { expect } = require('@hapi/code')
// const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script()
// const sinon = require('sinon')
// const axios = require('axios')
// const { fetchDataForStationIds } = require('../../../lib/functions/imtd-process')

// describe('fetchDataForStationIds', () => {
//   let axiosGetStub

//   beforeEach(() => {
//     axiosGetStub = sinon.stub(axios, 'get')
//   })

//   afterEach(() => {
//     axiosGetStub.restore()
//   })

//   it('returns an array of threshold data for each station ID', async () => {
//     const stationIds = [{ rloi_id: '123' }, { rloi_id: '456' }]
//     const thresholdData1 = [{ stationId: '123', floodWarningArea: 'Area 1', floodWarningType: 'Type 1', direction: 'Direction 1', level: 1 }]
//     const thresholdData2 = [{ stationId: '456', floodWarningArea: 'Area 2', floodWarningType: 'Type 2', direction: 'Direction 2', level: 2 }]
//     axiosGetStub
//       .onFirstCall().resolves({ data: [{ TimeSeriesMetaData: [] }] })
//       .onSecondCall().resolves({ data: [{ TimeSeriesMetaData: [] }] })
//     sinon.stub(require('../models/parse-thresholds'), 'parseThresholds').resolves(thresholdData1, thresholdData2)

//     const result = await fetchDataForStationIds(stationIds)

//     expect(result).to.equal([...thresholdData1, ...thresholdData2])
//   })

//   it('handles failed requests and returns an array of failed station IDs', async () => {
//     const stationIds = [{ rloi_id: '123' }, { rloi_id: '456' }]
//     axiosGetStub
//       .onFirstCall().resolves({ data: [{ TimeSeriesMetaData: [] }] })
//       .onSecondCall().rejects({ response: { status: 404 } })
//     sinon.stub(require('../models/parse-thresholds'), 'parseThresholds').resolves([{ stationId: '123', floodWarningArea: 'Area 1', floodWarningType: 'Type 1', direction: 'Direction 1', level: 1 }])

//     const result = await fetchDataForStationIds(stationIds)

//     expect(result).to.equal([{ stationId: '123', floodWarningArea: 'Area 1', floodWarningType: 'Type 1', direction: 'Direction 1', level: 1 }])
//     expect(result.failed).to.equal([{ rloi_id: '456' }])
//   })
// })
