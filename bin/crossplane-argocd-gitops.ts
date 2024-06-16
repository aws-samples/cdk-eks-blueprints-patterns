#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { errorHandler } from '../lib/common/construct-utils';
import MultiClusterPipelineConstruct from "../lib/crossplane-argocd-gitops/multi-cluster-pipeline";

const app = new cdk.App();

new MultiClusterPipelineConstruct().buildAsync(app,  "crossplane-argocd-gitops").catch((e) => {
    errorHandler(app, "Pipeline construct failed because of error: ", e);
});
