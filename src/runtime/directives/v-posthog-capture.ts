import { useNuxtApp } from '#app';
import type { PostHog } from 'posthog-js';
import type { ObjectDirective, FunctionDirective } from 'vue';

const directive: FunctionDirective<HTMLElement, PostHogCaptureEvent | string> = (el, { value, arg }) => {
  const nuxtApp = useNuxtApp();

  const $clientPosthog = nuxtApp.$clientPosthog as PostHog | undefined;
  if (!$clientPosthog) return;

  if (el.hasAttribute('posthog-listener')) return;

  el.setAttribute('posthog-listener', 'true');

  el.addEventListener(arg ?? 'click', () => {
    if (!$clientPosthog) return;

    if (typeof value === 'string') $clientPosthog.capture(value);
    else $clientPosthog.capture(value.name, value.properties);
  });
};

export const vPostHogCapture: ObjectDirective = {
  mounted: directive,
  updated: directive,
};
