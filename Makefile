.PHONY: help localstack-start localstack-stop localstack-setup localstack-test localstack-clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

test: ## Run unit tests (fast, no Docker needed)
	npm test

localstack-start: ## Start LocalStack container
	@echo "🚀 Starting LocalStack..."
	@docker run --rm -d \
		-p 4566:4566 \
		-p 4510-4559:4510-4559 \
		-v /var/run/docker.sock:/var/run/docker.sock \
		--name localstack \
		localstack/localstack
	@echo "Waiting for LocalStack to be ready..."
	@sleep 5
	@curl -s http://localhost:4566/_localstack/health > /dev/null && echo "LocalStack is ready!" || echo "LocalStack failed to start"

localstack-stop: ## Stop LocalStack container
	@echo "Stopping LocalStack..."
	@docker stop localstack || true
	@docker rm localstack || true
	@echo "LocalStack stopped"

localstack-setup: ## Deploy lambdas and setup LocalStack environment
	./scripts/localstack-setup.sh

localstack-test: ## Run integration tests against LocalStack
	npm run localstack-test

localstack-clean: ## Clean up LocalStack completely
	./scripts/localstack-teardown.sh

localstack-full: localstack-start localstack-setup localstack-test ## Start LocalStack, setup, and run tests

localstack-logs: ## Show LocalStack logs
	docker logs localstack --tail 100 -f
