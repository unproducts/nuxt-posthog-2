import { defineNuxtPlugin, useRouter, useRuntimeConfig, useState } from '#app';
import type { PostHog, JsonType, PostHogConfig } from 'posthog-js';
import { defu } from 'defu';

export default defineNuxtPlugin({
  name: 'posthog',
  enforce: 'post',
  setup: async (nuxtApp) => {
    const config = useRuntimeConfig().public.posthog;

    if (!config?.client)
      return {
        provide: {
          posthog: 'Deprecated: use $clientPosthog instead.' as const,
          clientPosthog: null as PostHog | null,
        },
      };

    if (!config.key || !config.host) {
      throw new Error(
        'PostHog client is enabled but key or host not found. Set client to false in module options to disable.',
      );
    }

    const posthog = (await import('posthog-js')).posthog;

    const posthogFeatureFlags = useState<Record<string, boolean | string> | undefined>('ph-feature-flags');
    const posthogFeatureFlagPayloads = useState<Record<string, JsonType> | undefined>('ph-feature-flag-payloads');

    const clientOptions = defu<PostHogConfig, Partial<PostHogConfig>[]>(config.clientOptions ?? {}, {
      api_host: config.host,
      capture_pageview: false,
      capture_pageleave: !!config.capturePageLeaves,
      bootstrap: {
        featureFlags: posthogFeatureFlags.value,
        featureFlagPayloads: posthogFeatureFlagPayloads.value,
      },
    });

    if (config.proxy && config.host) {
      const url = new URL(config.host);
      const region = url.hostname.split('.')[0];

      clientOptions.ui_host = `https://${region}.posthog.com`;
      clientOptions.api_host = `${window.location.origin}/ingest/ph`;
    }

    const posthogClient = posthog.init(config.key, clientOptions);

    nuxtApp.callHook('posthog:init', posthogClient);

    if (config.capturePageViews) {
      // Make sure that pageviews are captured with each route change
      const router = useRouter();

      router.afterEach((to) => {
        posthog.capture('$pageview', {
          current_url: to.fullPath,
        });
      });
    }

    posthog.onFeatureFlags((flags, featureFlags) => {
      posthogFeatureFlags.value = featureFlags;
      posthogFeatureFlagPayloads.value = flags.reduce<Record<string, JsonType>>((acc, flag) => {
        acc[flag] = posthog.getFeatureFlagPayload(flag);
        return acc;
      }, {});
    });

    return {
      provide: {
        clientPosthog: (posthogClient ? posthogClient : null) as PostHog | null,
        posthog: 'Deprecated: use $clientPosthog instead.' as const,
      },
    };
  },
});
