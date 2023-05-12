#!/usr/bin/env node
import NginxIngressConstruct from '../lib/nginx-ingress-construct';
import { configureApp, errorHandler } from '../lib/common/construct-utils';

const app = configureApp();

new NginxIngressConstruct().buildAsync(app, 'nginx').catch((e) => {
    errorHandler(app, "NGINX Ingress pattern is not setup. This maybe due to missing secrets for ArgoCD admin pwd.", e);
});
