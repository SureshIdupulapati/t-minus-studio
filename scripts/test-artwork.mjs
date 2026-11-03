import assert from 'node:assert/strict';
import test from 'node:test';

// Invalid requests only: no paid generation or saved-goal mutations.
const origin = process.argv[2];
if (!origin) throw new Error('Usage: node scripts/test-artwork.mjs <app-origin>');
const endpoint = new URL('/api/gemini/artwork', origin);
const brief = { goal: 'Launch my portfolio', prompt: 'Quiet forest landscape', format: 'phone', milestones: [], width: 1440, height: 2560 };
async function rejected(body, status = 400) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal(response.status, status);
  const value = await response.json();
  assert.equal(typeof value.error, 'string');
}
test('requires a brief or reference image', () => rejected({ ...brief, prompt: ' ' }));
test('rejects mismatched phone canvas dimensions', () => rejected({ ...brief, width: 1920, height: 1080 }));
test('rejects mismatched desktop canvas dimensions', () => rejected({ ...brief, format: 'desktop' }));
test('rejects custom dimensions below minimum', () => rejected({ ...brief, format: 'custom', width: 0 }));
test('rejects oversized custom canvases', () => rejected({ ...brief, format: 'custom', width: 5001 }));
test('rejects malformed reference content', () => rejected({ ...brief, referenceImage: { mimeType: 'image/png', data: 'YWJjZA==' } }));
test('rejects unsupported reference MIME types', () => rejected({ ...brief, referenceImage: { mimeType: 'image/svg+xml', data: 'YWJjZA==' } }));
test('rejects an oversized request before invoking Gemini', () => rejected({ ...brief, prompt: 'x'.repeat(2_200_000) }, 413));
test('rejects non-capability artwork paths', async () => {
  const response = await fetch(new URL('/api/artwork/not-a-valid-id.jpg', origin));
  assert.equal(response.status, 404);
});
