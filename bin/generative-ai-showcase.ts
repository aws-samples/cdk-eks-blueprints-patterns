import GenAIShowcase from "../lib/generative-ai-showcase";
import { configureApp } from "../lib/common/construct-utils";

const app = configureApp();

new GenAIShowcase(app, 'generative-ai-showcase');
