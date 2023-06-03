import { KonveyorConstruct, KonveyorConstructProps } from '../lib/konveyor-construct';
import { configureApp } from '../lib/common/construct-utils';

const app = configureApp();

const konveyorConstructProps = {
    account: '273057222892',
    region: 'eu-west-2',
    parentDomain: "freschri.people.aws.dev",
    konveyorLabel: "konveyor8",
    hostedZoneId: "Z0873316CBF3FGWYFV8X",
    certificateResourceName: "konveyor-certificate",
  } as KonveyorConstructProps;
  

  new KonveyorConstruct(app, 'konveyor-stack', konveyorConstructProps);