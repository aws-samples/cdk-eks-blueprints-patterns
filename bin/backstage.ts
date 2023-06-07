import { BackstageConstruct, BackstageConstructProps } from '../lib/backstage-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

const backstageConstructProps = {
    account: process.env.CDK_DEFAULT_ACCOUNT!, // replace with your account
    region: process.env.CDK_DEFAULT_REGION!, // replace with your region
    namespace: "backstage", // replace if you want, not needed
    backstageImageRegistry:  "youraccount.dkr.ecr.yourregion.amazonaws.com", // replace with your registry
    backstageImageRepository: "e.g.: backstage", // replace with your repository
    backstageImageTag: "latest", // replace with your tag
    parentDomain: "example.com", // replace with your parent domain
    backstageLabel: "backstage", // replace if you want, not needed
    hostedZoneId: "1234", // Hosted zone ID (format: 20x chars/numbers)
    certificateResourceName: "backstage-certificate", // replace if you want, not needed
    databaseResourceName: "backstage-database", // replace if you want, not needed
    databaseInstancePort: 5432, // replace if you want, not needed
    databaseSecretResourceName: "backstage-database-credentials", // replace if you want, not needed
    username: "postgres", // replace if you want, not needed
    databaseSecretTargetName: "backstage-database-secret", // replace if you want, not needed
  } as BackstageConstructProps;
  
  new BackstageConstruct(app, 'backstage-stack', backstageConstructProps);