import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('Analytics initializes the requested property without leaking PDF query metadata', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-5G040P491R/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const source = scripts.find(([, code]) => code.includes("gtag('config'"))?.[1];
  assert.ok(source);
  const url = new URL('https://flipbook.vriksh.ca/?pdf=https://example.com/private.pdf?token=secret&page=4#private');
  const context = { location: url, dataLayer: [] };
  context.window = context;
  vm.runInNewContext(source, context);
  const config = context.dataLayer.find(entry => entry[0] === 'config');
  assert.equal(config[1], 'G-5G040P491R');
  assert.equal(config[2].page_location, 'https://flipbook.vriksh.ca/');
  assert.equal(config[2].page_title, 'flipbook');
  assert.doesNotMatch(JSON.stringify(context.dataLayer), /private|secret|token=|page=4/);
});

test('Clarity bootstraps only its assigned project and queues calls until loaded', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const source = [...html.matchAll(/<script type="text\/javascript">([\s\S]*?)<\/script>/g)][0]?.[1];
  assert.ok(source);
  const inserted = [];
  const first = { parentNode: { insertBefore: node => inserted.push(node) } };
  const context = {
    document: { createElement: tag => ({ tag }), getElementsByTagName: () => [first] },
  };
  context.window = context;
  vm.runInNewContext(source, context);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].src, 'https://www.clarity.ms/tag/z0u0h01nl0');
  assert.equal(inserted[0].async, 1);
  context.clarity('event', 'test');
  assert.deepEqual(Array.from(context.clarity.q[0]), ['event', 'test']);
});
