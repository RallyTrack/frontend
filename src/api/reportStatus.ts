export function isAnalysisPending(error: { status?: number; errorCode?: string }): boolean {
  return error.status === 404 && error.errorCode === "ANALYSIS_NOT_READY";
}
