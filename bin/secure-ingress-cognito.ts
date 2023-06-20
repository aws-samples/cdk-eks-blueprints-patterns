import { SecureIngressCognito } from '../lib/secure-ingress-auth-cognito';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

//--------------------------------------------------------------------------
// Single Cluster, Secure Ingress Auth using cognito
//--------------------------------------------------------------------------

const app = configureApp();

new SecureIngressCognito()
    .buildAsync(app, 'secure-ingress')
    .catch((e) => {
        errorHandler(app, "Secure Ingress Auth pattern is not setup due to missing secrets for ArgoCD admin pwd. \
            See Secure Ingress Auth in the readme for instructions", e);
    });
