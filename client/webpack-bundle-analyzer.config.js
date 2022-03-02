const { merge } = require("webpack-merge");
const mainClient = require("./webpack.config.js");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = (env, argv) =>
  merge(mainClient(env, argv), {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: "static",
      }),
    ],
  });
