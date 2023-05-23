import { cosmiconfig, defaultLoaders, type Loader } from 'cosmiconfig';

import { pathToFileURL } from 'url';

export interface Config {
  version?: string;
}

// tracking mjs support https://github.com/cosmiconfig/cosmiconfig/issues/224
const loadJs: Loader = async function loadJs(filepath, content) {
  try {
    const { href } = pathToFileURL(filepath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (await import(href)).default;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return defaultLoaders['.js'](filepath, content);
  }
};

export async function loadConfig(baseDir: string): Promise<Config | null> {
  const moduleName = 'dataeden';
  const explorer = cosmiconfig(moduleName, {
    loaders: {
      '.mjs': loadJs,
    },
    searchPlaces: [
      // tracking mjs support https://github.com/cosmiconfig/cosmiconfig/issues/224
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.mjs`,
      `.${moduleName}rc.cjs`,
      `.config/${moduleName}rc`,
      `.config/${moduleName}rc.json`,
      `.config/${moduleName}rc.yaml`,
      `.config/${moduleName}rc.yml`,
      `.config/${moduleName}rc.js`,
      `.config/${moduleName}rc.mjs`,
      `.config/${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.mjs`,
      `${moduleName}.config.cjs`,
    ],
  });

  const potentialConfig = await explorer.search(baseDir);

  // TODO: we should properly type narrow this
  return potentialConfig?.config as unknown as Config;
}

export function defineConfig(config: Config): Config {
  return config;
}
