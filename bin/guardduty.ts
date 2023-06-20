import { GuardDutySetupStack } from "../lib/security/guardduty-construct/guardduty-setup";
import GuardDutyWorkloadConstruct from "../lib/security/guardduty-construct";
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new GuardDutySetupStack(app, "guardduty-setup");

new GuardDutyWorkloadConstruct().buildAsync(app, "guardduty").catch((e) => {
    errorHandler(app, "GuardDutyWorkloadConstruct is not setup due to missing secrets for ArgoCD admin pwd", e);
});
