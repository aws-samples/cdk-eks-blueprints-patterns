import { configureApp } from '../lib/common/construct-utils';
import { SecurityHubStackSetup } from '../lib/security/securityhub-construct';

const app = configureApp();
new SecurityHubStackSetup(app, 'securityhub-setup');