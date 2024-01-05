import { KonveyorConstruct } from "../lib/konveyor-construct";
import { configureApp } from "../lib/common/construct-utils";

const app = configureApp();

new KonveyorConstruct(app, 'konveyor-stack');