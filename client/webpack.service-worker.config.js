const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    // ensure this key matches the "chunks" list in the html webpack plugin config below
    registerServiceWorker: "./src/push-notifications/registerServiceWorker.ts",
    serviceWorker: "./src/push-notifications/serviceWorker.ts",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-typescript",
              [
                "@babel/preset-env",
                { exclude: ["@babel/plugin-transform-regenerator"] },
              ],
            ],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["registerServiceWorker"],
      template: "./src/push-notifications/index.html",
      scriptLoading: "blocking",
    }),
  ],
  output: {
    clean: true,
    publicPath: ".",
    filename: (pathData) =>
      pathData.chunk.name === "serviceWorker"
        ? "[name].js"
        : "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist/push-notifications"),
  },
};
