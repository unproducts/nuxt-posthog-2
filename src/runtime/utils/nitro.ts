import { useRuntimeConfig } from '#imports';
import type { PostHog } from 'posthog-node';

const POSTHOG_SERVER_MISSING =
  'PostHog server is enabled but key or host not found. Set server to false in module options to disable.';

let posthog: PostHog | null = null;
export const usePostHog = async () => {
  const serverConfig = useRuntimeConfig().posthog;
  const publicConfig = useRuntimeConfig().public.posthog;

  if (!serverConfig?.server) return null;

  if (!publicConfig?.key || !publicConfig?.host) {
    throw new Error(POSTHOG_SERVER_MISSING);
  }

  if (!posthog) {
    const PostHog = (await import('posthog-node')).PostHog;
    posthog = new PostHog(publicConfig.key, {
      host: publicConfig.host,
      ...serverConfig.serverOptions,
    });
  }

  return posthog;
};
