export interface ModelConfig {
    name: string;
    cost: number;
    description: string;
}

export interface RouterConfig {
    models: ModelConfig[];
}