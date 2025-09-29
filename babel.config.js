module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
  ],
  plugins: [
    "@babel/plugin-transform-modules-commonjs",
    [
      "module-resolver",
      {
        alias: {
          "@": "./src"
        }
      }
    ]
  ]
};
