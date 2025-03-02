const path = require('path');

const nextConfig = {
  webpack: (config, { webpack }) => {
    const iconPath = path.resolve(webpack.context, './icons');
    const fontPath = path.resolve(config.context, './fonts');
    Object.assign(config.resolve.alias, {
      '@icons': iconPath,
      '@fonts': fontPath,
    });

    config.plugins.push(
      new webpack.IgnorePlugin(/[\\/]__tests__[\\/]/),
      new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /en|fr|es|ja/),
      new webpack.EnvironmentPlugin({
        FOO_BAR: null,
      }),
    );

    config.module.rules.push({
      test: /\.md$/,
      use: ['babel-loader', 'raw-loader', 'markdown-loader'],
    });

    config.module.rules.push({
      test: /fonts[\\/].*\.(woff|woff2|eot|ttf|otf|svg)$/,
      use: [
        {
          loader: 'url-loader',
        },
      ],
    });

    config.module.rules.unshift(
      {
        test: /static[\\/].*\.(html)$/,
        use: {
          loader: 'html-loader',
        },
      },
      {
        test: /static[\\/].*\.(css)$/,
        use: {
          loader: 'raw-loader',
        },
      },
      {
        test: /static[\\/].*\.(jpg|gif|png|svg)$/,
        use: {
          loader: 'file-loader',
        },
      },
    );

    config.module.rules.push({
      test: /components\/.*\.(svg)$/,
      use: {
        loader: 'url-loader',
      },
    });

    return config;
  },
};

module.exports = nextConfig;
