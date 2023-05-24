import { configureApp, errorHandler } from '../lib/common/construct-utils';
import { SecurityHubStackSetup } from '../lib/security/securityhub-construct/securityhub-setup';
import SecurityHubWorkloadConstruct from "../lib/security/securityhub-construct";

const app = configureApp();
new SecurityHubStackSetup(app, 'securityhub-setup');

new SecurityHubWorkloadConstruct().buildAsync(app, "securityhub").catch(() => {
    errorHandler(app, "SecurityHubWorkloadConstruct is not setup due to missing secrets for ArgoCD admin pwd");
});