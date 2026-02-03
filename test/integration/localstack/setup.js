'use strict'

const { S3Client, CreateBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const { LambdaClient, CreateFunctionCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// LocalStack configuration
const localstackEndpoint = 'http://localhost:4566'
const region = 'eu-west-2'
const bucket = 'test-flood-data-bucket'

const s3Client = new S3Client({
  endpoint: localstackEndpoint,
  region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

const lambdaClient = new LambdaClient({
  endpoint: localstackEndpoint,
  region,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

async function setupS3Bucket () {
  console.log('Creating S3 bucket:', bucket)
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }))
    console.log('✓ S3 bucket created')
  } catch (err) {
    if (err.name === 'BucketAlreadyOwnedByYou') {
      console.log('✓ S3 bucket already exists')
    } else {
      throw err
    }
  }
}

async function uploadTestData () {
  console.log('Uploading test data to S3...')

  const files = [
    { key: 'rloi/test-data.xml', file: 'test/data/rloi-test.xml' },
    { key: 'ffoi/test-data.xml', file: 'test/data/ffoi-test.xml' }
  ]

  for (const { key, file } of files) {
    const body = fs.readFileSync(path.join(__dirname, '../../../', file))
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body
    }))
    console.log(`✓ Uploaded ${key}`)
  }
}

async function deployLambda (functionName, handler) {
  console.log(`Deploying Lambda: ${functionName}...`)

  // Create zip file
  const zipPath = `/tmp/${functionName}.zip`
  console.log('Creating deployment package...')
  execSync(`cd ${path.join(__dirname, '../../..')} && zip -r ${zipPath} lib node_modules -q`, { stdio: 'inherit' })

  const zipContent = fs.readFileSync(zipPath)

  try {
    await lambdaClient.send(new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: 'nodejs20.x',
      Role: 'arn:aws:iam::000000000000:role/lambda-role',
      Handler: `lib/functions/${handler}`,
      Code: { ZipFile: zipContent },
      Environment: {
        Variables: {
          IS_LOCALSTACK: 'true',
          LFW_DATA_DB_CONNECTION: 'postgres://postgres:postgres@host.docker.internal:5432/flood_data',
          LFW_DATA_FWIS_API_URL: 'https://example.com',
          LFW_DATA_FWIS_API_KEY: 'test'
        }
      },
      Timeout: 30
    }))
    console.log(`✓ Lambda ${functionName} created`)
  } catch (err) {
    if (err.name === 'ResourceConflictException') {
      console.log(`✓ Lambda ${functionName} already exists, updating config...`)
      await lambdaClient.send(new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        Environment: {
          Variables: {
            IS_LOCALSTACK: 'true',
            LFW_DATA_DB_CONNECTION: 'postgres://postgres:postgres@host.docker.internal:5432/flood_data',
            LFW_DATA_FWIS_API_URL: 'https://example.com',
            LFW_DATA_FWIS_API_KEY: 'test'
          }
        }
      }))
    } else {
      throw err
    }
  }
}

async function setup () {
  console.log('=== Setting up LocalStack Integration Tests ===')
  await setupS3Bucket()
  await uploadTestData()
  await deployLambda('fwis-process', 'fwis-process.handler')
  await deployLambda('rloi-process', 'rloi-process.handler')
  await deployLambda('ffoi-process', 'ffoi-process.handler')
  console.log('=== Setup complete ===\n')
}

module.exports = { setup, s3Client, lambdaClient, bucket, localstackEndpoint, region }
