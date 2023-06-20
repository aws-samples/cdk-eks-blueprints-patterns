import DynatraceOperatorConstruct from '../lib/dynatrace-construct';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new DynatraceOperatorConstruct().buildAsync(app, "dynatrace-operator").catch((e) => {
    errorHandler(app, "Dynatrace pattern is not setup due to missing secrets for dynatrace-tokens.", e);
});