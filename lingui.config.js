module.exports = {
  sourceLocale: "en",
  locales: ["en", "fi"],
  catalogs: [
    {
      path: "src/locales/{locale}/messages",
      include: ["src"],
    },
  ]
}; 