import { configureApp } from "../lib/common/construct-utils";
import GpuConstruct from "../lib/gpu-construct";

const app = configureApp();

new GpuConstruct().build(app, "gpu");
