const { i18n } = require("./next-i18next.config.js");

const nextConfig = {
  eslint: {
    dirs: ["pages"],
  },
  reactStrictMode: false,
  // swcMinify: false,
  env: {
    LANGUAGES: process.env.LANGUAGES,
    PUBLIC_RECAPTCHA_SITE_KEY: process.env.PUBLIC_RECAPTCHA_SITE_KEY,
    INDEX_PUBLICATION: process.env.INDEX_PUBLICATION,
    INDEX_PERSON: process.env.INDEX_PERSON,
    INDEX_ORGUNIT: process.env.INDEX_ORGUNIT,
    INDEX_JOURNAL: process.env.INDEX_JOURNAL,
    INDEX_PROGRAM: process.env.INDEX_PROGRAM,
    INDEX_PATENT: process.env.INDEX_PATENT,
    INDEX_GROUP: process.env.INDEX_GROUP,
    INDEX_SOFTWARE: process.env.INDEX_SOFTWARE,
    INDEX_COURSE: process.env.INDEX_COURSE,
    BRCRIS_HOST_BASE: process.env.BRCRIS_HOST_BASE,
  },
  i18n,

  webpack: (config, { webpack, isServer }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    config.externals["node:fs"] = "commonjs node:fs";
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );

    return config;
  },
};

module.exports = nextConfig;
