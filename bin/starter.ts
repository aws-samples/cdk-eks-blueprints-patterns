#!/usr/bin/env node
import { configureApp } from '../lib/common/construct-utils';
import StarterConstruct from '../lib/starter-construct';

const app = configureApp();

new StarterConstruct().build(app, 'starter-construct');
