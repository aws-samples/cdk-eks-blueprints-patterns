#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
//import { logger, userLog } from '@aws-quickstart/eks-blueprints/dist/utils';
import { HelmAddOn } from '@aws-quickstart/eks-blueprints';



const app = new cdk.App();
//userLog.info("\n\n=== Run <code>make compile</code> before each run. === \n\n\n");

// CDK Default Environment - default account and region
const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;
const env: cdk.Environment = { account: account, region: region };

HelmAddOn.validateHelmVersions = false;

import StarterConstruct from '../lib/starter-construct';

new StarterConstruct().build(app, 'starter-construct');
