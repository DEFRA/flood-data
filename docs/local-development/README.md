# Local Development Documentation

This folder contains comprehensive documentation for developing and testing the flood-data project locally.

## Quick Start

**New to this project?** Start here:
- **[Getting Started Guide](GETTING_STARTED.md)** - Setup, install, and run your first tests

## Documentation Files

| File | Purpose | Who Should Read |
|------|---------|----------------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Setup, install, run tests | **Everyone - start here** |
| [LOCALSTACK_TESTING.md](LOCALSTACK_TESTING.md) | Full LocalStack integration test guide | DevOps, Integration testing |
| [manual.md](manual.md) | Manual LocalStack setup and Lambda invocation | Advanced users |
| [devcontainer.md](devcontainer.md) | VS Code dev container setup | VS Code users |
| [common.md](common.md) | Common development tasks | All developers |

## Testing Approaches

### Unit Tests (npm test) - Daily Development
```bash
npm test  # Runs in ~1 second
```
- No Docker required
- All dependencies mocked
- Fast feedback
- **Use this for daily development**

### LocalStack Integration Tests - Pre-Deployment
```bash
npm run localstack-test  # Runs in ~30-60 seconds  
```
- Tests real Lambda execution
- S3 and database integration
- Requires Docker + LocalStack setup
- **Use this before deploying to AWS**

## Which Guide Should I Read?

**I want to run tests quickly while developing**
→ Run `npm test` - see [Getting Started](GETTING_STARTED.md)

**I want to test Lambda functions locally with AWS services**
→ See [LocalStack Testing Guide](LOCALSTACK_TESTING.md)

**I want to manually invoke Lambdas in LocalStack**
→ See [Manual Setup Guide](manual.md)

**I want a complete dev environment in VS Code**
→ See [Dev Container Guide](devcontainer.md)
