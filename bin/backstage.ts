import { BackstageConstruct, BackstageConstructProps } from '../lib/backstage-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

const backstageConstructProps = {
    account: '...',
    region: '...',
    namespace: "backstage",
    backstageImageRegistry:  "e.g.: {account}.dkr.ecr.{region}.amazonaws.com",
    backstageImageRepository: "e.g.: backstage",
    backstageImageTag: "e.g.: latest",
    parentDomain: "e.g.: example.com",
    backstageLabel: "e.g.: backstage",
    hostedZoneId: "Hosted zone ID (format: 20x chars/numbers)",
    certificateResourceName: "e.g.: backstage-certificate",
    databaseResourceName: "e.g.: backstage-database",
    databaseInstancePort: 5432,
    databaseSecretResourceName: "e.g.: backstage-database-credentials",
    username: "e.g.: postgres",
    databaseSecretTargetName: "e.g.: backstage-database-secret",
  } as BackstageConstructProps;
  
  new BackstageConstruct(app, 'backstage-stack', backstageConstructProps);