export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Uusi ominaisuus
        'fix',      // Bugfix
        'docs',     // Dokumentaation muutokset
        'style',    // Koodin muotoilun muutokset (ei vaikuta logiikkaan)
        'refactor', // Koodin refaktorointi
        'perf',     // Suorituskyvyn parannukset
        'test',     // Testien lisäys tai muutos
        'build',    // Build-järjestelmän muutokset
        'ci',       // CI/CD muutokset
        'chore',    // Muut muutokset
        'revert'    // Aiemman commitin peruminen
      ]
    ],
    'subject-case': [0], // Salli kaikki kirjainkoot otsikossa
    'subject-empty': [2, 'never'], // Otsikko ei saa olla tyhjä
    'subject-full-stop': [2, 'never', '.'], // Ei pisteitä otsikon lopussa
    'header-max-length': [2, 'always', 72] // Maksimi 72 merkkiä
  }
} 