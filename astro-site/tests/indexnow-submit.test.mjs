import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIndexNowPayload, submitIndexNow } from '../scripts/indexnow-submit.mjs';

const KEY = '664b51f681d527165b2b9ddfa0baa0d3941c8392135481d74ac3d0278eda514d';

test('builds a deduplicated same-host IndexNow payload', () => {
  const payload = buildIndexNowPayload({
    key: KEY,
    urls: [
      'https://www.yhflexiblebusbar.com/en/',
      'https://www.yhflexiblebusbar.com/en/#top',
    ],
  });

  assert.equal(payload.host, 'www.yhflexiblebusbar.com');
  assert.deepEqual(payload.urlList, ['https://www.yhflexiblebusbar.com/en']);
  assert.match(payload.keyLocation, /\.txt$/);
});

test('rejects URLs outside the verified host', () => {
  assert.throws(
    () => buildIndexNowPayload({ key: KEY, urls: ['https://example.com/page'] }),
    /must belong to/,
  );
});

test('submits JSON and accepts a successful IndexNow response', async () => {
  let request;
  const result = await submitIndexNow({
    key: KEY,
    urls: ['https://www.yhflexiblebusbar.com/pt'],
    fetchImpl: async (_endpoint, options) => {
      request = { endpoint: _endpoint, options, body: JSON.parse(options.body) };
      return new Response('', { status: 200 });
    },
  });

  assert.equal(result.status, 200);
  assert.equal(request.endpoint, 'https://api.indexnow.org/indexnow');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(request.body.urlList, ['https://www.yhflexiblebusbar.com/pt']);
});
