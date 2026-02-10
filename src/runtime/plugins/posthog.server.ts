import { defineNuxtPlugin, useCookie, useRuntimeConfig, useState } from '#app';
import type { PostHog } from 'posthog-node';
import type { JsonType } from 'posthog-js';

export default defineNuxtPlugin({
  name: 'posthog-server',
  enforce: 'pre',
  setup: async () => {
    const config = useRuntimeConfig().public.posthog;
    const runtimeConfig = useRuntimeConfig().posthog;

    if (!config || !runtimeConfig.server)
      return {
        provide: {
          serverPosthog: null as PostHog | null,
        },
      };

    const PostHog = (await import('posthog-node')).PostHog;

    const posthog = new PostHog(config.key, { host: config.host });
    await posthog.reloadFeatureFlags();

    const identity = useCookie('ph-identify', { default: () => '' });

    const { featureFlags, featureFlagPayloads } = await posthog.getAllFlagsAndPayloads(identity.value);

    useState<Record<string, boolean | string> | undefined>('ph-feature-flags', () => featureFlags);
    useState<Record<string, JsonType> | undefined>('ph-feature-flag-payloads', () => featureFlagPayloads);

    return {
      provide: {
        serverPosthog: posthog,
      },
    };
  },
});
