![CI](https://github.com/DEFRA/flood-data/actions/workflows/ci.yml/badge.svg)[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_flood-data&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_flood-data)[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_flood-data&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_flood-data)

# flood-data

## Synopsis

This repo contains multiple AWS lambda functions to provide the processing of data files for LFW from FWFI

## Lambda Functions

### ffoi-process

Pulls in the forcast telemetry data from the S3 bucket and processes it into the database

### fgs-process

Lambda that checks for the latest flood guidence statement and if it is newer than the last processed one it will download the file and put it in our S3 bucket

### fwis-process

Gets all warnings and alerts from the FWIS api and puts them in the database

### imtd-process

This Lambda will check every station in the database agaist the IMTD api and update the database with the latest thresholds for each station. Calling its self after each station in order to minimise the time the lambda runs for. This is run every two weeks and the different envs have to run on different days as the IMTD api cant handle the load of all the stations at once from multiple envs.

### rloi-process

brings in the observed telemtery data from the S3 bucket and processes it into the database

### rloi-refresh

refreshes the materialized views and clears out the old telemetry.

### station-process

Uses the exports context file from sharepoint to update the stations in the database.

## Local development

### Quick Start

```bash
# Clone and install
git clone <repository-url>
cd flood-data
npm install

# Run unit tests (fast, no Docker required)
npm test
```

### Testing

This project has two testing approaches:

**Unit Tests** (npm test) - Daily development
- Fast (~1 second)
- No Docker required
- All dependencies mocked
- Run before every commit

**LocalStack Integration Tests** (npm run localstack-test) - Pre-deployment
- Slower (~30-60 seconds)
- Requires Docker, LocalStack, PostgreSQL
- Tests full Lambda execution with S3/DB
- Run before deploying to AWS

### Documentation

- **[Getting Started](docs/local-development/GETTING_STARTED.md)** - Setup guide for new developers
- **[LocalStack Testing](docs/local-development/LOCALSTACK_TESTING.md)** - Integration test setup
- **[Quick Reference](docs/local-development/QUICK_REFERENCE.md)** - Common commands
- **[Manual Setup](docs/local-development/manual.md)** - Advanced LocalStack usage

For detailed instructions, see [docs/local-development/](docs/local-development/).

## Deployment

This is installed using terraforms/terragrunt which is managed by WebOps

## Testing

### Unit Tests
```bash
npm test
```
Runs fast unit tests with all dependencies mocked. No Docker required.

### Integration Tests
```bash
npm run localstack-test
```
Runs integration tests against LocalStack (local AWS). Requires Docker setup.

See [docs/local-development/](docs/local-development/) for setup instructions.

## Unit tests and linting
`npm run pre-deployment-test`

## 🔧 Configuration

Since migrating from Serverless to Terraform for deploying Lambdas, the configuration for this service is now split between two sources: **GitLab** and **AWS Secrets Manager**. This structure ensures better separation of concerns and secure handling of sensitive data.

### GitLab-Managed Environment Variables

Configuration values related to infrastructure and deployment context are maintained in GitLab under [`lfwconfig`](https://gitlab-dev.aws-int.defra.cloud/flood/lfwconfig/-/tree/master/lfw-data):

```bash
export LFW_DATA_DB_CONNECTION=
export LFW_DATA_TARGET_ENV_NAME=
export LFW_DATA_SERVICE_CODE=
export LFW_DATA_TARGET_REGION=
export LFW_DATA_SLS_BUCKET=
export LFW_DATA_SLS_BUCKET_ARN=
export LFW_DATA_SLS_LAMBA_ROLE=
export LFW_DATA_VPN_SECURITY_GROUP=
export LFW_DATA_SUBNET_1=
export LFW_DATA_SUBNET_2=
```

These values are version-controlled and environment-specific.

### AWS Secrets Manager

Sensitive or shared configuration values are stored securely in AWS Secrets Manager. These are managed by the **WebOps** team and can only be changed through them:

```bash
export LFW_DATA_FWIS_API_URL=
export LFW_DATA_FWIS_API_KEY=
export LFW_DATA_FGS_KEY=
```

If you need updates to these secrets, please contact WebOps.

### Terraform-Managed Scheduled Tasks

Cron configurations (e.g., thresholds, data syncs) are managed per environment via Terraform:

```bash
export LFW_DATA_IMTD_THRESHOLD_SCHEDULE=
export LFW_DATA_DTS_SCHEDULE=
export LFW_DATA_FWIS_SCHEDULE=
```

These are defined in the Terraform modules and should be updated through the infrastructure as code process.

### IMTD API Configuration

All environments use the IMTD test API **except Pre and Prod**, which use the **public API endpoint**. This allows automated tests to run safely without affecting production data.

```bash
export imtd-api-url=
```

