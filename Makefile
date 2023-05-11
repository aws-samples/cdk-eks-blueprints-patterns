#!/bin/bash

# Libraries
TSC := node node_modules/.bin/tsc
ESLINT := node node_modules/.bin/eslint
CDK := node node_modules/.bin/cdk
PATTERN_ARG := $(firstword $(filter-out pattern,$(MAKECMDGOALS)))
LAST_ARG := $(lastword $(filter-out $@,$(MAKECMDGOALS)))
# Dependecies
HOMEBREW_LIBS :=  nvm typescript argocd

deps: bootstrap
	npm install


lint: 
	$(ESLINT) . --ext .js,.jsx,.ts,.tsx

build:
	rm -rf dist && $(TSC) --skipLibCheck

compile:
	$(TSC) --build --incremental 

list: 
	$(CDK) list

mkdocs:
	mkdocs serve 

synth: 
	$(CDK) synth	

pattern:
	@echo first $(PATTERN_ARG) and last $(LAST_ARG)
	$(CDK) --app "npx ts-node bin/$(PATTERN_ARG).ts" $(LAST_ARG)

bootstrap:
	@for LIB in $(HOMEBREW_LIBS) ; do \
		LIB=$$LIB make check-lib ; \
    done

check-lib:
ifeq ($(shell brew ls --versions $(LIB)),)
	@echo Installing $(LIB) via Hombrew
	@brew install $(LIB)
else
	@echo $(LIB) is already installed, skipping.
endif