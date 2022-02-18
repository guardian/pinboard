const path = require("path");

module.exports = {
  entry: "./src/app.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-typescript",
              "@emotion/babel-preset-css-prop", // replaces @babel/preset-react
              "@babel/preset-env",
            ],
          },
        },
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
    clean: {
      keep: /push-notifications/, // allow service-worker webpack to clean its own dist dir
    },
    library: "PinBoard",
    filename: "pinboard.main.[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
};
