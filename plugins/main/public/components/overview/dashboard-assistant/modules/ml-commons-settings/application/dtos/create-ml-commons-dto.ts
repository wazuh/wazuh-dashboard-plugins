export interface CreateMLCommonsDto {
  endpoints_regex: string[];
}

export const buildCreateMLCommonsDto = (
  endpoints_regex: string[],
): CreateMLCommonsDto => {
  return { endpoints_regex };
};
