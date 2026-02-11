import type { ModuleOptions } from '../../module';
import type { HookResult } from 'nuxt/schema';
import type { PostHog } from 'posthog-js';

declare module '@nuxt/schema' {
  /** Server-only config (private). Key/host live in public only; Nitro usePostHog reads serverOptions here. */
  interface RuntimeConfig {
    posthog: {
      server: boolean;
      serverOptions?: ModuleOptions['serverOptions'];
    };
  }
  /** Client config (public). Single source of truth for key/host. Read in client plugins and server plugin. */
  interface PublicRuntimeConfig {
    posthog?: Pick<
      ModuleOptions,
      'key' | 'host' | 'capturePageViews' | 'capturePageLeaves' | 'clientOptions' | 'proxy'
    > & {
      client: boolean;
    };
  }
}

declare module '#app' {
  /** Custom runtime hook used by nuxtApp.hook('posthog:init', ...) */
  interface RuntimeNuxtHooks {
    'posthog:init': (posthog: PostHog | null) => HookResult;
  }
}
