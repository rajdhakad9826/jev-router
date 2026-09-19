import type { RouterConfig } from "./types.js";

export class Router {
    private config: RouterConfig;

    constructor(config: RouterConfig) {
        this.config = config;
    }
}