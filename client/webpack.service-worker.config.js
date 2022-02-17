const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: "./src/push-notifications/registerServiceWorker.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: [
          /node_modules/,
          /dist/
        ]
      }
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/push-notifications/index.html',
      scriptLoading: 'blocking'
    })
  ],
  output: {
    assetModuleFilename: "[name][ext]",
    clean: true,
    publicPath: ".",
    path: path.resolve(__dirname, "dist/push-notifications"),
  },
};
