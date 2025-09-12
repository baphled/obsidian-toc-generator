module.exports = {
  settings: {
    "vetur.useWorkspaceDependencies": true,
    "vetur.experimental.templateInterpolationService": true,
    "vetur.validation.interpolation": true,
    "vetur.validation.templateProps": true,
  },
  projects: [
    {
      root: "./",
      package: "./package.json",
      // **optional** default: `[]`
      // Register globally Vue component glob.
      // If you set it, you can get completion by that components.
      // It is relative to root property.
      // Notice: It won't actually do it. You need to use `require.context` or `Vue.component`
      globalComponents: [
        "./src/**/*.js",
        {
          name: "BackToTop",
          path: "./src/BackToTop.js",
        },
        {
          name: "Frontmatter",
          path: "./src/Frontmatter.js",
        },
        {
          name: "TableOfContents",
          path: "./src/TableOfContents.js",
        },
        {
          name: "Transform",
          path: "./src/Transform.js",
        },
        {
          name: "Utils",
          path: "./src/Utils.js",
        },
      ],
    },
  ],
};
