# Adding and Deploying a Lambda

This guide records the repository steps for adding a Lambda and the deployment information currently available in this repo. The infrastructure is managed separately by WebOps, so confirm the open deployment details with the owning team before relying on the Jenkins steps below.

## 1. Add the Lambda handler

Add the handler implementation under `lib/functions/`, following the existing function modules. Export an async `handler` function for the Lambda runtime. Keep the entry point focused on orchestration and reuse helpers from `lib/helpers/` for shared work such as database, S3, logging, or API access.

For example, `lib/functions/fgs-process.js` exports `module.exports.handler` and uses the shared S3 and HTTP helpers.

Before implementing the handler, identify:

- The event or schedule that invokes it, and the expected event shape.
- The external services and data stores it needs.
- Required environment variables and whether they are ordinary configuration or secrets.
- Any IAM permissions or network access it will need; coordinate these with WebOps because the infrastructure is managed outside this repository.

## 2. Add unit tests

Add a matching test module under `test/unit/functions/`, following the existing function tests. Stub external calls so unit tests do not depend on AWS or external APIs. Cover the normal path and relevant failures, and check that the handler uses its dependencies and configuration as intended.

If the change needs a real deployed-Lambda check, add or update an appropriate test under `test/integration/`. Integration tests invoke deployed functions and depend on the configured AWS environment, so they are not a substitute for the unit tests.

## 3. Add configuration and infrastructure

The Lambda needs AWS infrastructure as well as handler code. In this project, that infrastructure is deployed with Terraform/Terragrunt managed by WebOps; the Jenkins deployment job applies the infrastructure changes. This should normally be defined as infrastructure-as-code rather than created manually in the AWS console.

Once the local Lambda is running and validates the approach, raise a **non-PRD service desk request** for WebOps to deploy it and provide any other infrastructure it needs in the cloud environment. Use the [CCOE Azure/AWS Non-Production Service Request](https://defragroup.service-now.com/esc?id=sc_cat_item&table=sc_cat_item&sys_id=cedac95b1b224510adf0eb53b24bcb63). WebOps owns the Terraform changes for cloud infrastructure.

Include the following in the request so WebOps can assess the setup:

- Lambda name, purpose, source branch, runtime, and handler entry point.
- How it should run: schedule, frequency and timezone, or the event source that invokes it.
- AWS services and data stores it needs, plus required IAM permissions and network access.
- Required environment variables and secrets, identifying which values are sensitive.
- Any database schema changes and whether they have been applied before deploying the Lambda.
- Required timeout, memory, logging, monitoring, and alerting settings.

Ask WebOps to confirm which Terraform resources they will change, how the Jenkins job described below fits their deployment process, which non-production environment to deploy to first, and how to promote the change to other environments. Validate each non-production deployment before requesting production changes.

### Logging and monitoring

Decide which per-run details the Lambda needs to expose, such as records processed, inserted or deleted, duration, and success/failure status. The application or database code must emit any custom counts; do not assume the monitoring platform can infer them. For database cleanup jobs, clarify whether deletion counts should include records removed by dropping partitions or other bulk operations.

Ask WebOps which platform metrics and logs are available in LogicMonitor, how failures are alerted, whether missed scheduled runs are detected, and how email recipients are configured. Set the missed-run alert threshold well before any source data or retry window expires.

For each new Lambda, coordinate with WebOps to configure the following in Terraform:

- The Lambda function, runtime, handler entry point, deployment package, and operational settings such as timeout and memory.
- An execution role with the AWS permissions the handler needs. If the function accesses a database or other private service, its VPC, subnets, and security groups also need to be configured.
- Environment variables and secrets. The README says environment-specific configuration is maintained in GitLab (`lfwconfig`) and secrets are stored in AWS Secrets Manager and managed by WebOps.
- The invocation source. For a time-based run, configure the schedule for each environment, the schedule target, and permission for the scheduling service to invoke the Lambda. The README says schedules are managed per environment in Terraform. For an event-driven Lambda, configure the relevant event source and its invoke permissions instead.
- Logging and any required monitoring or alarms, following the existing infrastructure conventions.

The Jenkins pipeline identifies the service-specific Terraform and Terragrunt repositories and the Lambda module paths (see the deployment section). The exact Terraform resources to change for a new Lambda and the change process still need confirming with WebOps. Agree the required settings and schedule with the service owner before asking WebOps to deploy.

There are event-rule JSON files under `config/`, but this repo's deployment documentation says schedules are Terraform-managed. Confirm with WebOps whether any new Lambda needs a file in `config/` before adding one; do not assume these files are the current deployment source.

## 4. Run repository checks

Before deployment, run the checks defined by this repository:

```bash
npm run pre-deployment-test
```

This runs linting and the unit test suite. After deployment, the repository also defines:

```bash
npm run post-deployment-test
```

This runs the integration test suite. Confirm the target environment and required access before running it.

## 5. Deploy through Jenkins

Use this Jenkins job to deploy the Flood Data Lambda pipeline. Replace `{stage}` with the appropriate environment code:

```text
LFW_{stage}_99_DEPLOY_FLOOD_DATA_PIPELINE_TF
```

The Jenkins pipeline definition is `jenkins/lambda/lfwDeployJenkinsfile`. It checks out three repositories:

- Terragrunt from `git@gitlab-ops.aws-int.defra.cloud:${SERVICE_CODE}/provision_${SERVICE_CODE}_terragrunt.git`.
- Terraform from `git@gitlab-ops.aws-int.defra.cloud:${SERVICE_CODE}/provision_${SERVICE_CODE}_terraform.git`.
- This application from `https://github.com/DEFRA/flood-data.git`, using the `LFW_SRC_GITHUB_BRANCH` Jenkins folder property which you can configure in Jenkins.

The pipeline parameters select the Terragrunt branch (`TERRAGRUNT_BRANCH`, default `master`), Terraform branch (`TERRAFORM_BRANCH`, default `terraform-main`), and module (`MODULE_DEPLOY`, currently `lambda`). Jenkins folder properties provide the target AWS region, environment, service code, location, and credential IDs.

For `MODULE_DEPLOY=lambda`, the pipeline requires the app repo's `.nvmrc`, uses `tgenv` 0.58.12 and `tfenv` 1.5.5, then runs `terragrunt apply -auto-approve` for the Lambda layer followed by the Lambda function. It applies from the environment-specific Terragrunt directories `tg/{LOCATION}/{AWS_REGION}/{ENVIRONMENT}/lambda_layer` and `tg/{LOCATION}/{AWS_REGION}/{ENVIRONMENT}/lambda`, using the corresponding Terraform modules under `tf/lambda_layer` and `tf/lambda`. Both applies receive the app branch as `git_repository_branch`.

This pipeline file is not present in the `flood-data` repository; it is part of the Jenkins job's pipeline source.

Production deployment is managed by WebOps; confirm who runs the job and what approvals are required.

## 6. Verify deployment

After deployment to a non-production environment, verify the following before promoting the change:

- The Jenkins build completed successfully for the intended environment and source branch, including both the Lambda layer and function stages.
- The Lambda exists and is active in AWS. Confirm the deployed runtime, handler, execution role, environment configuration, and network settings match the change.
- The invocation source is enabled and targets the expected Lambda. For scheduled functions, check the schedule and next expected run. For event-driven functions, check the source configuration or event source mapping.
- The invocation permissions are correct for the source type. Push-based sources should have permission to invoke the Lambda; poll-based event sources should have the required permissions on the Lambda execution role.
- Run a safe test invocation, or wait for the next scheduled/event-driven invocation. Check that it completes successfully and produces the expected side effect, such as a database update or S3 object. Avoid manual invocation where it could cause unintended changes.
- Check the Lambda's CloudWatch logs and metrics for the invocation, errors, duration, and throttling. Confirm with WebOps whether these are also visible in LogicMonitor and whether the expected alerts reach their recipients.
- Run `npm run post-deployment-test` when the integration tests cover the Lambda and the target environment is configured. Confirm the target before running tests that can modify data.
