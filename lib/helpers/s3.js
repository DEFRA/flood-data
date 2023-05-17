const AWS = require('aws-sdk')

const createS3Client = () => {
  const s3Config = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE', // Replace with your access key ID
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', // Replace with your secret access key
    endpoint: 'http://localhost:9444',
    s3ForcePathStyle: true, // Required for S3 Ninja
    signatureVersion: 'v4'
  }

  return new AWS.S3(process.env.NODE_ENV === 'LOCAL_TEST' ? s3Config : {})
}

const s3Client = createS3Client()

module.exports = {
  getObject (params) {
    return s3Client.getObject(params).promise()
  },
  putObject (params) {
    // Put object then set ACL to allow bucket-owner-full-control
    params.ACL = 'bucket-owner-full-control'
    return s3Client.putObject(params).promise()
  },
  upload (params) {
    // Put object then set ACL to allow bucket-owner-full-control
    params.ACL = 'bucket-owner-full-control'
    return s3Client.upload(params).promise()
  },
  deleteObject (params) {
    return s3Client.deleteObject(params).promise()
  },
  listObjects (params) {
    return s3Client.listObjectsV2(params).promise()
  }
}
