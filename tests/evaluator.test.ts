import { describe, it, expect } from 'vitest';
import { evaluateRemediation } from '../src/engine/evaluator';
import { testCases } from '../src/data/test-cases';

describe('Evaluator', () => {
  it('should pass on valid remediation', () => {
    const testCase = testCases[0]; // SQL injection
    const validOutput = `
      const query = "SELECT * FROM users WHERE username = $1 AND password = $2";
      db.query(query, [username, password]);
    `;
    expect(evaluateRemediation(testCase, validOutput)).toBe(true);
  });

  it('should fail on invalid remediation', () => {
    const testCase = testCases[0];
    const invalidOutput = `
      // I added a comment but left the code the same
      const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    `;
    expect(evaluateRemediation(testCase, invalidOutput)).toBe(false);
  });
});
