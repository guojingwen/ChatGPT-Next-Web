import { LLMModel } from "../client/api";

export function collectModelTable(models: readonly LLMModel[]) {
  const modelTable: Record<
    string,
    { available: boolean; name: string; displayName: string }
  > = {};

  // default models
  models.forEach(
    (m) =>
      (modelTable[m.name] = {
        ...m,
        displayName: m.name,
      }),
  );
  return modelTable;
}

/**
 * Generate full model table.
 */
export function collectModels(models: readonly LLMModel[]) {
  const modelTable = collectModelTable(models);
  const allModels = Object.values(modelTable);

  return allModels;
}
