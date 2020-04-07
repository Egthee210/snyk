import { test } from 'tap';

import { fakeServer } from './acceptance/fake-server';
import { getVersion } from '../src/lib/version';
import { formatReachability } from '../src/cli/commands/test/formatters/format-reachability';
import { REACHABILITY } from '../src/lib/snyk-test/legacy';
import cli = require('../src/cli/commands');

const apiKey = '123456789';

const port = (process.env.PORT = process.env.SNYK_PORT = '12345');
process.env.SNYK_API = 'http://localhost:' + port + '/api/v1';
process.env.SNYK_HOST = 'http://localhost:' + port;
process.env.LOG_LEVEL = '0';
let oldkey;
let oldendpoint;
let versionNumber;
const server = fakeServer(process.env.SNYK_API, apiKey);

test('setup', async (t) => {
  versionNumber = await getVersion();
  let key = await cli.config('get', 'api');
  oldkey = key;
  t.pass('existing user config captured');

  key = await cli.config('get', 'endpoint');
  oldendpoint = key;
  t.pass('existing user endpoint captured');

  await new Promise((resolve) => {
    server.listen(port, resolve);
  });
  t.pass('started demo server');
});

// TODO check feature flag?
test('"snyk test --reachable-vulns" non maven not supported', async (t) => {
  const options = { 'reachable-vulns': true, packageManager: 'npm' };

  try {
    await cli.test('./', options);
  } catch (error) {
    t.equal(
      error.userMessage,
      `'--reachable-vulns' is not supported for package manager 'npm'.`,
    );
    t.equal(error.code, 422);
  }
});

test('"snyk test --reachable-vulns" non maven not supported', async (t) => {
  const options = { 'reachable-vulns': true };

  try {
    await cli.test('./', options);
  } catch (error) {
    t.equal(
      error.userMessage,
      `'--reachable-vulns' is not supported for package manager 'npm'.`,
    );
    t.equal(error.code, 422);
  }
});

test('output formatting', (t) => {
  t.equal(formatReachability(REACHABILITY.FUNCTION), '[Reachable by function call]');
  t.equal(formatReachability(REACHABILITY.PACKAGE), '[Reachable by package import]');
  t.equal(formatReachability(REACHABILITY.UNREACHABLE), '[Unreachable]');
  t.equal(formatReachability(REACHABILITY.NO_INFO), '');
  t.end();
});


test('teardown', async (t) => {
  delete process.env.SNYK_API;
  delete process.env.SNYK_HOST;
  delete process.env.SNYK_PORT;
  t.notOk(process.env.SNYK_PORT, 'fake env values cleared');

  await new Promise((resolve) => {
    server.close(resolve);
  });
  t.pass('server shutdown');
  let key = 'set';
  let value = 'api=' + oldkey;
  if (!oldkey) {
    key = 'unset';
    value = 'api';
  }
  await cli.config(key, value);
  t.pass('user config restored');
  if (oldendpoint) {
    await cli.config('endpoint', oldendpoint);
    t.pass('user endpoint restored');
  } else {
    t.pass('no endpoint');
  }
});
