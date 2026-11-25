import { check, error, verdict, z } from '@cairul/plugin-kit';
import { junit, testPlugin } from '@cairul/plugin-kit/reports';

const reports = testPlugin('appium.passed', { junit });
const endpoint = z.url({ protocol: /^https?$/ });

export default function appium(options = {}) {
  const { serverUrl } = z.strictObject({ serverUrl: endpoint.default('http://127.0.0.1:4723') }).parse(options);
  return {
    checkKinds: {
      ...reports().checkKinds,
      'appium.server-ready': check(
        z.strictObject({ url: endpoint.optional() }),
        async ({ url = serverUrl }, { signal }) => {
          try {
            const response = await globalThis.fetch(url.replace(/\/$/, '') + '/status', { signal, redirect: 'error' });
            if (!response.ok) return error('Appium returned HTTP ' + response.status + '.');
            const { value } = await response.json();
            if (typeof value?.ready !== 'boolean') return error('Appium returned no readiness state.');
            return verdict(value.ready, value.ready ? 'Appium is ready.' : 'Waiting for Appium readiness.');
          } catch {
            return verdict(false, 'Waiting for the local Appium server.');
          }
        }
      ),
    },
  };
}
