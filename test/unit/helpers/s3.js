'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const { mockClient } = require('aws-sdk-client-mock')
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} = require('@aws-sdk/client-s3')

const s3Wrapper = require('../../../lib/helpers/s3')

const s3Mock = mockClient(S3Client)

lab.experiment('S3 Wrapper Module', () => {
  lab.beforeEach(() => {
    s3Mock.reset()
  })

  lab.test('getObject should send GetObjectCommand with correct params', async () => {
    const mockedBody = new Uint8Array(Buffer.from('mocked-body'))
    const params = { Bucket: 'test-bucket', Key: 'test-key' }
    s3Mock.on(GetObjectCommand).resolves({ Body: mockedBody })

    const result = await s3Wrapper.getObject(params)

    Code.expect(result.Body).to.equal(mockedBody)
    Code.expect(s3Mock.commandCalls(GetObjectCommand, params).length).to.equal(1)
  })

  lab.test('putObject should send PutObjectCommand with ACL set', async () => {
    const params = { Bucket: 'test-bucket', Key: 'test-key', Body: 'data' }
    s3Mock.on(PutObjectCommand).resolves({ ETag: '"etag"' })

    const result = await s3Wrapper.putObject({ ...params })

    Code.expect(result.ETag).to.equal('"etag"')
    const calls = s3Mock.commandCalls(PutObjectCommand)
    Code.expect(calls.length).to.equal(1)
    Code.expect(calls[0].args[0].input.ACL).to.equal('bucket-owner-full-control')
  })

  lab.test('deleteObject should send DeleteObjectCommand with correct params', async () => {
    const params = { Bucket: 'test-bucket', Key: 'test-key' }
    s3Mock.on(DeleteObjectCommand).resolves({})

    const result = await s3Wrapper.deleteObject(params)

    Code.expect(result).to.be.an.object()
    Code.expect(Object.keys(result)).to.have.length(0)
    Code.expect(s3Mock.commandCalls(DeleteObjectCommand, params).length).to.equal(1)
  })

  lab.test('listObjects should send ListObjectsV2Command with correct params', async () => {
    const params = { Bucket: 'test-bucket' }
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] })

    const result = await s3Wrapper.listObjects(params)

    Code.expect(result.Contents).to.be.an.array()
    Code.expect(s3Mock.commandCalls(ListObjectsV2Command, params).length).to.equal(1)
  })
})
