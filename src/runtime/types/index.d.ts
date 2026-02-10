import type { ModuleOptions } from '../../module';

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    posthog: Pick<ModuleOptions, 'client' | 'server'>;
  }
  interface PublicRuntimeConfig {
    posthog?: Pick<
      ModuleOptions,
      'publicKey' | 'host' | 'capturePageViews' | 'capturePageLeaves' | 'clientOptions' | 'proxy'
    >;
  }
}
