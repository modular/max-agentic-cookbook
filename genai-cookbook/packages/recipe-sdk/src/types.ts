import type { LanguageModel } from 'ai'

export class ModelPreparationError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ModelPreparationError'
    this.status = status
  }
}

export type RecipeMetadata = {
  slug: string;
  title: string;
  description?: string;
  beCode?: string;
  feCode?: string;
};

export type Endpoint = {
  id: string;
  baseUrl: string;
  hwMake?: "NVIDIA" | "AMD";
  hwModel?: string;
};

export type Model = {
  id: string;
  name: string;
  baseUrl?: string;
};

export interface RecipeProps {
  endpoint: Endpoint | null;
  model: Model | null;
  pathname: string;
}

export type PrepareModelFn = (
  endpointId: string | undefined,
  modelName: string | undefined
) => Promise<LanguageModel>;

export interface RecipeContext {
  prepareModel: PrepareModelFn;
}
