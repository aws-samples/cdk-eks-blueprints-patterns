#!/usr/bin/env node
import GmaestroConstruct from '../lib/gmaestro-construct';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new GmaestroConstruct().buildAsync(app, 'gmaestro').catch((error) => {
    errorHandler(app, "Gmaestro is not setup due to missing secrets: " + error);
});
