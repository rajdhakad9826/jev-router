export interface ModelConfig {
    name: string;
    cost: number;
    description: string;
}

export type InternalModel = ModelConfig & {
    normalizedCost: number;
};

export interface RouterConfig {
    models: ModelConfig[];
}