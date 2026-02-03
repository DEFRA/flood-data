# Devcontainer local development

At present, running AWS Lambdas using LocalStack inside a devcontainer is
**not supported**.

This is due to Docker socket limitations in rootless Docker / WSL2
environments, which prevent LocalStack from starting Lambda executors.

This limitation has been discussed previously and is tracked for future
investigation.

Developers wishing to run Lambdas locally should use the manual setup.
