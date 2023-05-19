import { configureApp } from '../lib/common/construct-utils';
import { SecurityHubStackSetup } from '../lib/security/securityhub-construct/securityhub-setup';

const app = configureApp();
new SecurityHubStackSetup(app, 'securityhub-setup');