const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    register: "./src/push-notifications/registerServiceWorker.ts",
    serviceWorker: "./src/push-notifications/serviceWorker.ts",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: [/node_modules/, /dist/],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["register"],
      template: "./src/push-notifications/index.html",
      scriptLoading: "blocking",
    }),
  ],
  output: {
    clean: true,
    publicPath: ".",
    filename: "[name].js",
    path: path.resolve(__dirname, "dist/push-notifications"),
  },
};
