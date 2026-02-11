import { defineNuxtModule, addPlugin, createResolver, addServerImports } from '@nuxt/kit';
import type { PostHogConfig as PostHogClientOptions } from 'posthog-js';
import type { PostHogOptions as PostHogServerOptions } from 'posthog-node';
import { defu } from 'defu';

export interface ModuleOptions {
  /**
   * The PostHog API key
   * @default process.env.POSTHOG_API_KEY
   * @example 'phc_1234567890abcdef1234567890abcdef1234567890a'
   * @type string
   * @docs https://posthog.com/docs/api
   */
  key: string;

  /**
   * The PostHog API host
   * @default process.env.POSTHOG_API_HOST
   * @example 'https://app.posthog.com'
   * @type string
   * @docs https://posthog.com/docs/api
   */
  host: string;

  /**
   * If set to true, the module will capture page views automatically
   * @default true
   * @type boolean
   * @docs https://posthog.com/docs/product-analytics/capture-events#single-page-apps-and-pageviews
   */
  capturePageViews?: boolean;

  /**
   * If set to true, the module will capture page leaves automatically
   * @default true
   * @type boolean
   * @docs https://posthog.com/docs/product-analytics/capture-events#single-page-apps-and-pageviews
   */
  capturePageLeaves?: boolean;

  /**
   * PostHog Client options
   * @default {
   *    api_host: process.env.POSTHOG_API_HOST,
   * }
   * @type object
   * @docs https://posthog.com/docs/libraries/js#config
   */
  clientOptions?: Partial<PostHogClientOptions>;

  /**
   * PostHog Server options
   * @default {
   *    api_host: process.env.POSTHOG_API_HOST,
   * }
   * @type object
   * @docs https://posthog.com/docs/libraries/node#config
   */
  serverOptions?: Partial<PostHogServerOptions>;

  /**
   * If set to true, the module will be enabled on the client side.
   * @default false
   * @type boolean
   */
  client?: boolean;

  /**
   * If set to true, the module will be enabled on the server side.
   * @default false
   * @type boolean
   */
  server?: boolean;

  /**
   * If set to true, PostHog will be proxied through the Nuxt server.
   * @default false
   * @type boolean
   * @docs https://posthog.com/docs/advanced/proxy/nuxt
   */
  proxy?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-posthog',
    configKey: 'posthog',
  },
  defaults: {
    key: process.env.POSTHOG_API_KEY as string,
    host: process.env.POSTHOG_API_HOST as string,
    capturePageViews: true,
    capturePageLeaves: true,
    client: false,
    server: false,
    proxy: false,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // Single source of truth: key and host only in public config (from env via options or runtimeConfig.public.posthog)
    const mergedKeyHost = defu(nuxt.options.runtimeConfig.public.posthog, { key: options.key, host: options.host });

    if (options.server) {
      // Server-relevant options (private) — Nitro usePostHog reads serverOptions here; key/host from public
      nuxt.options.runtimeConfig.posthog = {
        ...nuxt.options.runtimeConfig.posthog,
        server: true,
        ...(options.serverOptions && { serverOptions: options.serverOptions }),
      };
    }

    if (options.client) {
      // Client-relevant options (public) — client plugins and server plugin read from runtimeConfig.public.posthog
      nuxt.options.runtimeConfig.public.posthog = {
        ...nuxt.options.runtimeConfig.public.posthog,
        key: mergedKeyHost.key,
        host: mergedKeyHost.host,
        capturePageViews: options.capturePageViews,
        capturePageLeaves: options.capturePageLeaves,
        clientOptions: options.clientOptions,
        proxy: options.proxy,
        client: true,
      };
    }

    // Setup proxy (uses resolved host from public config)
    const publicPosthog = nuxt.options.runtimeConfig.public.posthog;
    if (publicPosthog?.proxy && publicPosthog?.host) {
      const url = new URL(publicPosthog.host);
      const region = url.hostname.split('.')[0];

      if (!region) {
        throw new Error('Invalid PostHog API host when setting proxy');
      }

      if (!['eu', 'us'].includes(region)) {
        throw new Error(`Invalid PostHog API host when setting proxy, expected 'us' or 'eu', got '${region}'`);
      }

      nuxt.options.routeRules = nuxt.options.routeRules || {};

      nuxt.options.routeRules['/ingest/ph/static/**'] = {
        proxy: `https://${region}-assets.i.posthog.com/static/**`,
      };
      nuxt.options.routeRules['/ingest/ph/**'] = {
        proxy: `https://${region}.i.posthog.com/**`,
      };
    }

    addPlugin(resolve('./runtime/plugins/posthog.client'));

    addServerImports([
      {
        from: resolve('./runtime/utils/nitro'),
        name: 'usePostHog',
      },
    ]);
  },
});
