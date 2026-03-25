import { describe, it, expect } from 'vitest';
import { AgentStrategy, ModelVersion } from '../src/types';

describe('Types', () => {
  it('should have correct enum values', () => {
    expect(AgentStrategy.Graph).toBe('graph');
    expect(ModelVersion.Gemini31ProPreview).toBe('gemini-3.1-pro-preview');
  });
});
