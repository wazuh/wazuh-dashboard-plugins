import { ModelPredictResponse } from './domain/types';

/**
 * Valida que la respuesta del modelo tenga la estructura esperada
 * @param response - La respuesta del modelo a validar
 * @throws Error si la respuesta no es válida
 * @returns true si la respuesta es válida
 */
export function validateModelPredictResponse(response: ModelPredictResponse): boolean {
  // Validar que la respuesta tenga la estructura esperada
  if (!response.inference_results || response.inference_results.length === 0) {
    throw new Error('La respuesta no contiene inference_results o está vacía');
  }

  const inferenceResult = response.inference_results[0];
  
  // Verificar que el status code sea 200
  if (inferenceResult.status_code !== 200) {
    throw new Error(`El status code es ${inferenceResult.status_code}, se esperaba 200`);
  }

  // Verificar que tenga output y que el primer output tenga dataAsMap
  if (!inferenceResult.output || inferenceResult.output.length === 0) {
    throw new Error('La respuesta no contiene output o está vacía');
  }

  const output = inferenceResult.output[0];
  if (!output.dataAsMap) {
    throw new Error('La respuesta no contiene dataAsMap');
  }

  const dataAsMap = output.dataAsMap;
  
  // Verificar que tenga contenido en alguno de los formatos soportados
  let hasValidContent = false;
  
  // Formato OpenAI (choices)
  if (dataAsMap.choices && dataAsMap.choices.length > 0) {
    const firstChoice = dataAsMap.choices[0];
    if (firstChoice.message && firstChoice.message.content && firstChoice.message.content.trim() !== '') {
      hasValidContent = true;
    }
  }
  
  // Formato Claude (content)
  if (!hasValidContent && dataAsMap.content && dataAsMap.content.length > 0) {
    const firstContent = dataAsMap.content[0];
    if (firstContent.text && firstContent.text.trim() !== '') {
      hasValidContent = true;
    }
  }
  
  if (!hasValidContent) {
    throw new Error('La respuesta no contiene contenido válido en ningún formato soportado');
  }

  return true;
}

/**
 * Versión que retorna boolean en lugar de lanzar errores
 * @param response - La respuesta del modelo a validar
 * @returns true si la respuesta es válida, false en caso contrario
 */
export function isValidModelPredictResponse(response: ModelPredictResponse): boolean {
  try {
    return validateModelPredictResponse(response);
  } catch {
    return false;
  }
}