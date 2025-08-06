import { ModelPredictResponse } from './domain/types';

export class ModelPredictValidator {
  /**
   * Validates that the model response has the expected structure
   * @param response - The model response to validate
   * @throws Error if the response is not valid
   * @returns true if the response is valid
   */
  public static validate(response: ModelPredictResponse): boolean {
    // Validate that the response has the expected structure
    if (
      !response.inference_results ||
      response.inference_results.length === 0
    ) {
      throw new Error(
        'The response does not contain inference_results or is empty',
      );
    }

    const inferenceResult = response.inference_results[0];

    if (inferenceResult.status_code !== 200) {
      throw new Error(
        `The status code is ${inferenceResult.status_code}, expected 200`,
      );
    }

    // Verify that it has output and that the first output has dataAsMap
    if (!inferenceResult.output || inferenceResult.output.length === 0) {
      throw new Error('The response does not contain output or is empty');
    }

    const output = inferenceResult.output[0];
    if (!output.dataAsMap) {
      throw new Error('The response does not contain dataAsMap');
    }

    const dataAsMap = output.dataAsMap;

    // Verify that it has content in any of the supported formats
    let hasValidContent = false;

    // OpenAI format (choices)
    if (dataAsMap.choices && dataAsMap.choices.length > 0) {
      const firstChoice = dataAsMap.choices[0];
      if (
        firstChoice.message &&
        firstChoice.message.content &&
        firstChoice.message.content.trim() !== ''
      ) {
        hasValidContent = true;
      }
    }

    // Claude format (content)
    if (!hasValidContent && dataAsMap.content && dataAsMap.content.length > 0) {
      const firstContent = dataAsMap.content[0];
      if (firstContent.text && firstContent.text.trim() !== '') {
        hasValidContent = true;
      }
    }

    if (!hasValidContent) {
      throw new Error(
        'The response does not contain valid content in any supported format',
      );
    }

    return true;
  }
}
