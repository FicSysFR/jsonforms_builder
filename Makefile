#!make

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

# --- Release -----------------------------------------------------------------
# `make release`     : chemin local — commit + push + gh release create (le workflow
#                      Publish prend le relais pour npm).
# `make release-ci`  : chemin CI — déclenche le workflow Release (bump + tag + Release
#                      + publication npm), tout se passe sur GitHub Actions.
VERSION ?=
PRERELEASE ?=
RELEASE_BRANCH ?= main

INCREMENT ?= none
NPM ?= true
LATEST ?= true
WATCH ?=
YES ?=

.PHONY: help install dev docs docs-build docs-preview build lint format test test-watch test-coverage test-regression test-perf release release-ci release-status ncu ncu-upgrade
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

build: ## Build the library (es + cjs + declarations)
	@yarn build

lint: ## Lint and check formatting (Biome)
	@yarn lint

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

release: ## Publish from local: commit bump + CHANGELOG, push, create the GitHub Release (VERSION=X.Y.Z [PRERELEASE=1])
	@node scripts/release.mjs --version "$(VERSION)" --branch "$(RELEASE_BRANCH)" $(if $(strip $(PRERELEASE)),--prerelease,)

release-ci: ## Run the GitHub Release workflow (INCREMENT=none|patch|minor|major NPM=true|false LATEST=true|false [WATCH=1] [YES=1])
	@node scripts/release-workflow.mjs --increment "$(INCREMENT)" --npm "$(NPM)" --latest "$(LATEST)" --branch "$(RELEASE_BRANCH)" $(if $(strip $(WATCH)),--watch,) $(if $(strip $(YES)),--yes,)

release-status: ## Show the latest Release workflow runs
	@gh run list --workflow release.yml --limit 5

ncu: ## Check latest versions of all project dependencies
	@npx --yes npm-check-updates

ncu-upgrade: ## Upgrade all project dependencies to the latest versions
	@npx --yes npm-check-updates -u && yarn install
