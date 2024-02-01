import { configureApp } from "../lib/common/construct-utils";
import GpuMonitoringConstruct from "../lib/gpu-monitoring";

const app = configureApp();

new GpuMonitoringConstruct().buildAsync(app, "gpu-monitoring");