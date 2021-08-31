#!/bin/bash

# Libraries
TSC := node node_modules/.bin/tsc
ESLINT := node node_modules/.bin/eslint
CDK := node node_modules/.bin/cdk

# Dependecies
HOMEBREW_LIBS :=  nvm typescript argocd

deps: bootstrap
	npm install


lint: 
	$(ESLINT) . --ext .js,.jsx,.ts,.tsx

build:
	rm -rf dist && $(TSC)

list: 
	$(CDK) list

mkdocs:
	mkdocs serve 

synth: 
	$(CDK) synth	

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

init:
	 npm run cdk bootstrap aws://382076407153/eu-west-1
	 npm run cdk bootstrap aws://382076407153/eu-west-3
	 npm run cdk bootstrap aws://382076407153/us-east-2

pipeline:
	npm run cdk deploy ssp-pipeline-stack