const path = require("path");

module.exports = {
  entry: "./src/pinboard.main.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  output: {
    library: "PinBoard",
    filename: "pinboard.main.[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
};
