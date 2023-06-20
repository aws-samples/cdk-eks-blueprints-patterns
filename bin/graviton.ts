import { configureApp } from "../lib/common/construct-utils";
import GravitonConstruct from "../lib/graviton-construct";

const app = configureApp();

new GravitonConstruct().build(app, "graviton");
