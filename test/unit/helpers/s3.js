'use strict'

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

describe('S3 Wrapper Module', () => {
  beforeEach(() => {
    s3Mock.reset()
  })

  it('getObject should send GetObjectCommand with correct params', async () => {
    const mockedBody = new Uint8Array(Buffer.from('mocked-body'))
    const params = { Bucket: 'test-bucket', Key: 'test-key' }
    s3Mock.on(GetObjectCommand).resolves({ Body: mockedBody })

    const result = await s3Wrapper.getObject(params)

    expect(result.Body).toEqual(mockedBody)
    expect(s3Mock.commandCalls(GetObjectCommand, params).length).toBe(1)
  })

  it('putObject should send PutObjectCommand with ACL set', async () => {
    const params = { Bucket: 'test-bucket', Key: 'test-key', Body: 'data' }
    s3Mock.on(PutObjectCommand).resolves({ ETag: '"etag"' })

    const result = await s3Wrapper.putObject({ ...params })

    expect(result.ETag).toBe('"etag"')
    const calls = s3Mock.commandCalls(PutObjectCommand)
    expect(calls.length).toBe(1)
    expect(calls[0].args[0].input.ACL).toBe('bucket-owner-full-control')
  })

  it('deleteObject should send DeleteObjectCommand with correct params', async () => {
    const params = { Bucket: 'test-bucket', Key: 'test-key' }
    s3Mock.on(DeleteObjectCommand).resolves({})

    const result = await s3Wrapper.deleteObject(params)

    expect(result).toBeInstanceOf(Object)
    expect(Object.keys(result)).toHaveLength(0)
    expect(s3Mock.commandCalls(DeleteObjectCommand, params).length).toBe(1)
  })

  it('listObjects should send ListObjectsV2Command with correct params', async () => {
    const params = { Bucket: 'test-bucket' }
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] })

    const result = await s3Wrapper.listObjects(params)

    expect(result.Contents).toBeInstanceOf(Array)
    expect(s3Mock.commandCalls(ListObjectsV2Command, params).length).toBe(1)
  })
})
