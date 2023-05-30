import { configureApp } from '../lib/common/construct-utils';
import { EksConfigRulesSetup } from '../lib/security/eks-config-rules';

const app = configureApp();
new EksConfigRulesSetup(app, 'eks-config-rules-setup');