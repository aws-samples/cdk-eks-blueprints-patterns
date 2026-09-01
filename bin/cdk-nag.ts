import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { configureApp } from '../lib/common/construct-utils';
import CdkNagConstruct from '../lib/cdk-nag-construct';


const app = configureApp();
cdk.Aspects.of(app).add(new AwsSolutionsChecks()); // run CDK-nag

new CdkNagConstruct(app, "cdk-nag-validation", app.account!);
