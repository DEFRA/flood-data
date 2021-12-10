[![Build Status](https://travis-ci.com/DEFRA/flood-data.svg?branch=master)](https://travis-ci.com/DEFRA/flood-data)[![Maintainability](https://api.codeclimate.com/v1/badges/f36df721e8bfd20f2f0b/maintainability)](https://codeclimate.com/github/DEFRA/flood-data/maintainability)[![Test Coverage](https://api.codeclimate.com/v1/badges/f36df721e8bfd20f2f0b/test_coverage)](https://codeclimate.com/github/DEFRA/flood-data/test_coverage)

# flood-data

## synopsis

This is a serverless project to provide the processing of data files for LFW from FWFI

## Installing

### There is a global dependency on [serverless](https://serverless.com/) which is used for configuration and deployments to AWS

`npm i -g serverless`

`npm install`

## Deployment

`npm run deploy`

## Unit tests and linting

`npm run pre-deployment-test`

## Feature testing (integration)

`npm run post-deployment-test`

### Setting up Docker Containers

This docker-compose.yml file provides a configuration for running S3-Ninja Docker containers.

## Prerequisites

1. Docker

## Instructions

1. In the same directory as the docker-compose.yml file, run the following command to start the containers: docker-compose up.
2. Wait for the containers to start. This may take a few minutes.
3. Verify that the containers are running by navigating to the following URLs: S3-Ninja: <http://localhost:9444/>
4. To stop the containers, run the following command: docker-compose down.

## Configuration

# S3-Ninja

1. Image: scireum/s3-ninja
2. Container name: s3-ninja
3. Volumes: s3ninja-data:/home/sirius/data: Mounts the S3-Ninja data directory as a volume to persist data across container restarts.
4. Ports: 9444:9000: Maps the S3-Ninja container's port 9000 to the host's port 9444.
5. User: 2000:2000: Runs the S3-Ninja container as a non-root user.
6. For more information on S3-Ninja, visit <https://s3ninja.net/>.
