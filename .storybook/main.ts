import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');
    const resolveFileUrlPlugin: Plugin = {
      name: 'resolve-file-url-imports',
      resolveId(id: string) {
        // Storybook 10 bug: import.meta.resolve() generates relative file:// URLs
        // that Rollup cannot resolve. Convert them to absolute paths.
        if (id.startsWith('file://./')) {
          return path.resolve(process.cwd(), id.slice('file://./'.length));
        }
        if (id.startsWith('file:///')) {
          return fileURLToPath(id);
        }
      }
    };
    return mergeConfig(config, {
      plugins: [resolveFileUrlPlugin],
    });
  }
};
export default config;
