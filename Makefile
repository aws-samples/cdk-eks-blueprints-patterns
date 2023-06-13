#!/bin/bash

# Libraries
TSC := node node_modules/.bin/tsc
ESLINT := node node_modules/.bin/eslint
CDK := node node_modules/.bin/cdk
pattern: pattern_name := $(firstword $(filter-out pattern, $(MAKECMDGOALS)))
pattern: pattern_command := $(subst pattern $(pattern_name), , $(MAKECMDGOALS))

pattern_files := $(notdir $(wildcard bin/*.ts))
formatted_pattern_names := $(patsubst %.ts,%,$(pattern_files))

# Dependecies
HOMEBREW_LIBS :=  nvm typescript argocd


deps: bootstrap
	npm install

lint: 
	$(ESLINT) . --ext .js,.jsx,.ts,.tsx

lint-fix: 
	$(ESLINT) . --ext .js,.jsx,.ts,.tsx --fix

build:
	rm -rf dist && $(TSC) --skipLibCheck

compile:
	$(TSC) --build --incremental 

list: 
	@$ echo "To work with patterns use: \n\t$$ make pattern <pattern-name> <list | deploy | synth | destroy>" 
	@$ echo "Example:\n\t$$ make pattern fargate deploy \n\nPatterns: \n" 
	@$ $(foreach pattern, $(formatted_pattern_names),  echo "\t$(pattern)";)

mkdocs:
	mkdocs serve 

pattern:
	@echo $(pattern_name) performing $(pattern_command)
	$(CDK) --app "npx ts-node bin/$(pattern_name).ts" $(if $(pattern_command),$(pattern_command), list)

test-all:
	@for pattern in $(formatted_pattern_names) ; do \
		echo "Building pattern $$pattern"; \
		$(CDK) --app "npx ts-node bin/$$pattern.ts" list || exit 1 ;\
    done 

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
