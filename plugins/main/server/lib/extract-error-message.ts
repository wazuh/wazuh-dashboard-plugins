export function extractErrorMessage(error: any) {
  if (error?.isAxiosError) {
    return error.response?.data?.detail;
  }
  return error?.message || error || 'Unknown error';
}
