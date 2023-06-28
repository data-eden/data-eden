/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require('path');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'data-eden',
  tagline:
    'A group of libraries to handle data needs of an application managing data, caching, mocking, and reactivity',
  url: 'https://data-eden.github.io',
  baseUrl: '/data-eden/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  organizationName: 'data-eden',
  projectName: 'data-eden',
  plugins: [
    [
      require.resolve('docusaurus-plugin-search-local'),
      {
        highlightSearchTermsOnTargetPage: true,
        docsRouteBasePath: ['docs', 'api'],
      },
    ],
    [
      'docusaurus-plugin-typedoc-api',
      {
        projectRoot: path.join(__dirname, '..', '..'),
        packages: [
          'packages/network',
          'packages/cache',
          'packages/athena',
          'packages/mocker',
          'packages/codegen',
        ],
      },
    ],
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          editUrl: 'https://github.com/data-eden/data-eden/edit/main/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/data-eden/data-eden/edit/main/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'data-eden',
        items: [
          {
            type: 'doc',
            docId: 'overview',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: 'api/network',
            label: 'API',
            position: 'left',
          },
          {
            href: 'https://github.com/data-eden/data-eden',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/overview',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/data-eden/data-eden',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} data-eden, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
