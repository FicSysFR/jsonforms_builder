#!make

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

# --- Release -----------------------------------------------------------------
# `make release` déclenche l'unique workflow Release : validation, bump, tag,
# publication des deux tarballs npm et création de la Release GitHub.
VERSION ?=
CHANNEL ?= latest
WATCH ?=
YES ?=

.PHONY: help install dev docs docs-build docs-preview mcp-build stop build package lint typecheck format test test-watch test-coverage test-regression test-perf test-scripts changelog-build changelog-check release release-status ncu ncu-upgrade
.DEFAULT_GOAL := help
help:
	@printf "\033[33mUsage:\033[0m\n  make [target] [arg=\"val\"...]\n\n\033[33mTargets:\033[0m\n"
	@awk 'BEGIN { FS = ":.*##"; } /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies (yarn)
	@yarn install

dev: ## Start the playground alone + mock API (http://localhost:5174)
	@yarn start:dev

docs: ## Start VitePress + embedded playground (http://localhost:5173)
	@yarn docs:dev

docs-build: ## Build the documentation site (GitHub Pages)
	@yarn docs:build

docs-preview: ## Preview the built documentation site
	@yarn docs:preview

mcp-build: ## Build the @ficsysfr/jsonforms_builder-mcp package
	@yarn mcp:install && yarn mcp:build

stop: ## Stop Vite, VitePress and mock API (ports 5174/5173/4173/4000)
	@node scripts/stop-dev.mjs


build: ## Build the library (es + cjs + declarations)
	@yarn build

package: ## Build and audit both npm tarballs -> .artifacts/npm
	@yarn package

lint: ## Lint and check formatting (Biome)
	@yarn lint

typecheck: ## Type-check the library without emitting build artifacts
	@yarn typecheck

format: ## Apply safe fixes and reformat (Biome)
	@yarn lint:fix

test: ## Run the Vitest suite
	@yarn test

test-watch: ## Run the Vitest suite in watch mode
	@yarn test:watch

test-coverage: ## Run tests with v8 coverage -> ./coverage/lcov.info
	@yarn test:coverage

test-regression: ## Run the regression suite only
	@yarn test:regression

test-perf: ## Run the performance suite only
	@yarn test:perf

test-scripts: ## Test release, changelog and package tooling
	@yarn test:scripts

changelog-build: ## Generate CHANGELOG.md from changelog/X.Y.Z.md sources
	@yarn changelog:build

changelog-check: ## Verify generated changelog is synchronized
	@yarn changelog:check

release: ## Dispatch the single release workflow (VERSION=X.Y.Z [CHANNEL=latest|next] [WATCH=1] [YES=1])
	@node scripts/release.mjs --version "$(VERSION)" --channel "$(CHANNEL)" $(if $(strip $(WATCH)),--watch,) $(if $(strip $(YES)),--yes,)

release-status: ## Show the latest Release workflow runs
	@gh run list --workflow release.yml --limit 5

ncu: ## Check latest versions of all project dependencies
	@npx --yes npm-check-updates

ncu-upgrade: ## Upgrade all project dependencies to the latest versions
	@npx --yes npm-check-updates -u && yarn install
