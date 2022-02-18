const { merge } = require("webpack-merge");
const mainClient = require("./webpack.config.js");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = merge(mainClient, {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
    }),
  ],
});
