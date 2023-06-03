import { KonveyorConstruct, KonveyorConstructProps } from '../lib/konveyor-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

const konveyorConstructProps = {
    account: '...',
    region: '...',
    parentDomain: "e.g.: example.com",
    konveyorLabel: "e.g.: konveyor",
    hostedZoneId: "Hosted zone ID (format: 20x chars/numbers)",
    certificateResourceName: "e.g.: backstage-certificate",
  } as KonveyorConstructProps;
  

  new KonveyorConstruct(app, 'konveyor-stack', konveyorConstructProps);