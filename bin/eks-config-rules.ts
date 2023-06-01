import { configureApp } from '../lib/common/construct-utils';
import { EksConfigRulesSetup } from '../lib/security/eks-config-rules';
import { EksConfigSetup } from '../lib/security/eks-config-rules/config-setup';


const app = configureApp();

new EksConfigSetup(app, 'eks-config-setup');

new EksConfigRulesSetup(app, 'eks-config-rules-setup');
