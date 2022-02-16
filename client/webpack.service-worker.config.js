const path = require("path");

module.exports = {
  entry: "./src/push-notifications/index.html",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    publicPath: ".",
    path: path.resolve(__dirname, "dist/push-notifications"),
  },
};
