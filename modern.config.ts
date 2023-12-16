import { appTools, defineConfig } from '@modern-js/app-tools';

const IS_DEV = process.env.NODE_ENV === 'development';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: 'webpack',
    }),
  ],
  output: {
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      '@douyinfe/semi-ui': 'SemiUI',
      '@douyinfe/semi-icons': 'SemiIcons',
      mathjs: 'math',
    },
  },
  html: {
    tags: [
      {
        tag: 'script',
        attrs: {
          src: `https://unpkg.byted-static.com/react/18.2.0/umd/${
            IS_DEV ? 'react.development.js' : 'react.production.min.js'
          }`,
        },
        head: true,
      },
      {
        tag: 'script',
        attrs: {
          src: `https://unpkg.byted-static.com/react-dom/18.2.0/umd/${
            IS_DEV ? 'react-dom.development.js' : 'react-dom.production.min.js'
          }`,
        },
        head: true,
      },
      {
        tag: 'script',
        attrs: {
          src: 'https://unpkg.byted-static.com/douyinfe/semi-ui/2.48.0/dist/umd/semi-ui.min.js',
        },
        head: true,
      },
      {
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: 'https://unpkg.byted-static.com/douyinfe/semi-ui/2.48.0/dist/css/semi.css',
        },
        head: true,
      },
      {
        tag: 'script',
        attrs: {
          src: 'https://unpkg.byted-static.com/douyinfe/semi-icons/2.48.0/dist/umd/semi-icons.min.js',
        },
        head: true,
      },
      {
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: 'https://unpkg.byted-static.com/douyinfe/semi-icons/2.48.0/dist/css/semi-icons.css',
        },
        head: true,
      },
      {
        tag: 'script',
        attrs: {
          id: 'xlsx-script',
          src: 'https://unpkg.byted-static.com/xlsx/0.18.5/dist/xlsx.full.min.js',
          async: true,
        },
        head: true,
      },
    ],
  },
});
