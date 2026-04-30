import { createContext, useContext } from 'react';

export const AnalysisContext = createContext(null);

export function useAnalysisCtx() {
  return useContext(AnalysisContext);
}
