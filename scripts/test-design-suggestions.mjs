import assert from 'node:assert/strict';
import test from 'node:test';

// These checks intentionally never call Gemini or modify saved projects.
const baseUrl = process.argv[2];
if (!baseUrl) throw new Error('Usage: node scripts/test-design-suggestions.mjs <app-origin>');
const endpoint = new URL('/api/design-suggestions', baseUrl);
const brief = { goal: 'Finish a portfolio', prompt: 'Black and white', format: 'phone', milestones: [] };
async function rejected(body, status) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal(response.status, status);
  const value = await response.json();
  assert.equal(typeof value.error, 'string');
  assert.ok(value.error.length > 0);
}

test('requires a style description or reference', () => rejected({ ...brief, prompt: '  ' }, 400));
test('rejects unknown device formats', () => rejected({ ...brief, format: 'billboard' }, 400));
test('limits goal title size', () => rejected({ ...brief, goal: 'x'.repeat(121) }, 400));
test('rejects non-image reference data', () => rejected({ ...brief, referenceImage: { mimeType: 'image/png', data: Buffer.from('not an image').toString('base64') } }, 400));
test('rejects unsupported image types', () => rejected({ ...brief, referenceImage: { mimeType: 'image/svg+xml', data: 'YWJjZA==' } }, 400));
test('returns a structured error for oversized requests', () => rejected({ ...brief, prompt: 'x'.repeat(2_200_000) }, 413));
