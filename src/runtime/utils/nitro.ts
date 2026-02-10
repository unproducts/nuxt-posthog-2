import { useRuntimeConfig } from '#imports';
import type { PostHog } from 'posthog-node';

let posthog: PostHog | null = null;
export const usePostHog = async () => {
  const config = useRuntimeConfig().public.posthog;
  const runtimeConfig = useRuntimeConfig().posthog;
  if (!config || !runtimeConfig.server) return;

  if (!posthog) {
    const PostHog = (await import('posthog-node')).PostHog;
    posthog = new PostHog(config.key, { host: config.host });
  }

  return posthog;
};
