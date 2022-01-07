#!/bin/bash

# Libraries
TSC := node node_modules/.bin/tsc
ESLINT := node node_modules/.bin/eslint
CDK := node node_modules/.bin/cdk

# Dependecies
HOMEBREW_LIBS :=  nvm typescript argocd

deps: bootstrap
	npm install

clean:
	rm -rf node_modules

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
	 npm run cdk bootstrap aws://382076407153/eu-west-1 --force
	 npm run cdk bootstrap aws://382076407153/eu-west-3 --force
	 npm run cdk bootstrap aws://382076407153/us-east-2 --force

pipeline:
	npm run cdk deploy ssp-pipeline-stack --require-approval=never

multi-region:
	npm run cdk deploy multi-region


bottlerocket:
	npm run cdk deploy bottlerocket-blueprint

scratchpad:
	npm run cdk deploy scratchpad-blueprint

nginx-blueprint:
	npm run cdk deploy nginx-blueprint --require-approval=never

kubeflow-blueprint:
	npm run cdk deploy kubeflow-blueprint --require-approval=never