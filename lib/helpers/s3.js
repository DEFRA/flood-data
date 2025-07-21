const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3')

const s3 = new S3Client({})

module.exports = {
  getObject (params) {
    const command = new GetObjectCommand(params)
    return s3.send(command)
  },

  putObject (params) {
    // Put object then set ACL to allow bucket-owner-full-control
    params.ACL = 'bucket-owner-full-control'
    const command = new PutObjectCommand(params)
    return s3.send(command)
  },

  deleteObject (params) {
    const command = new DeleteObjectCommand(params)
    return s3.send(command)
  },

  listObjects (params) {
    const command = new ListObjectsV2Command(params)
    return s3.send(command)
  }
}
