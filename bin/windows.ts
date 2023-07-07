import { configureApp } from "../lib/common/construct-utils";
import WindowsConstruct from "../lib/windows-construct";

const app = configureApp();

new WindowsConstruct().build(app, "windows");
