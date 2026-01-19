export interface AnalysisResult {
  description: string;
  clarity: string;
  issues: string[];
  suggestions: string[];
  copy_variations: {
    headlines: string[];
    ctas: string[];
  };
  mode?: AnalysisMode; // Analysis mode used
}

export type AnalysisMode = 'marketing' | 'ux' | 'accessibility' | 'brand' | 'color-typography' | 'social-media' | 'conversion' | 'custom';

export interface AnalysisError {
  error: string;
}
