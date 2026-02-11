import { defineNuxtPlugin, useCookie, useRuntimeConfig, useState } from '#app';
import type { PostHog } from 'posthog-node';
import type { JsonType } from 'posthog-js';

export default defineNuxtPlugin({
  name: 'posthog-server',
  enforce: 'post',
  setup: async () => {
    const publicConfig = useRuntimeConfig().public.posthog;

    if (!publicConfig?.client)
      return {
        provide: {
          serverPosthog: null as PostHog | null,
        },
      };

    if (!publicConfig.key || !publicConfig.host) {
      throw new Error(
        'PostHog client (SSR) is enabled but key or host not found. Set client to false in module options to disable.'
      );
    }

    const PostHog = (await import('posthog-node')).PostHog;

    const posthog = new PostHog(publicConfig.key, { host: publicConfig.host });
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
