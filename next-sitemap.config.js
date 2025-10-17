/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: "https://brcris.ibict.br",
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  alternateRefs: [
    {
      href: "https://brcris.ibict.br/en",
      hreflang: "en",
    },
    {
      href: "https://brcris.ibict.br",
      hreflang: "pt-BR",
    },
  ],
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs:
        config.alternateRefs.map((alternate) => {
          // Ex: try to find '/en/'
          const hasPathLocale = path.substring(1, 3) === "en";

          //  Only fix alternateRefs if path has a locale en
          return hasPathLocale
            ? {
                ...alternate,
                // Note: concat original alternate with  '/en/my-page' => my-page
                href: `${alternate.href}/${path.substring(4)}`,
                hrefIsAbsolute: true,
              }
            : alternate;
        }) ?? [],
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
};
