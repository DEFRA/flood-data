const AWS = require('aws-sdk')

const s3Config = {
  accessKeyId: process.env.LOCAL_TEST_ACCESS_KEY, // Replace with your access key ID
  secretAccessKey: process.env.LOCAL_TEST_ACCESS_SECRET, // Replace with your secret access key
  endpoint: process.env.LOCAL_TEST_ENDPOINT,
  s3ForcePathStyle: process.env.LOCAL_TEST_STYLE_PATH, // Required for S3 Ninja
  signatureVersion: process.env.LOCAL_TEST_VERSION
}

const s3 = new AWS.S3(process.env.NODE_ENV === 'LOCAL_TEST' ? s3Config : {})

module.exports = {
  getObject (params) {
    return s3.getObject(params).promise()
  },
  putObject (params) {
    // Put object then set ACL to allow bucket-owner-full-control
    params.ACL = 'bucket-owner-full-control'
    return s3.putObject(params).promise()
  },

  upload (params) {
    // Put object then set ACL to allow bucket-owner-full-control
    params.ACL = 'bucket-owner-full-control'
    return s3.upload(params).promise()
  },
  deleteObject (params) {
    return s3.deleteObject(params).promise()
  },
  listObjects (params) {
    return s3.listObjectsV2(params).promise()
  }
}
