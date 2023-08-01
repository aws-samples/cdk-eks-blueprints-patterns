import KarpenterConstruct from "../lib/karpenter-construct";
import { configureApp } from "../lib/common/construct-utils";

const app = configureApp();

new KarpenterConstruct(app, 'karpenter');
