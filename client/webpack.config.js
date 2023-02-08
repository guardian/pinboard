const fs = require("fs");
const path = require("path");

const PreactRefreshPlugin = require("@prefresh/webpack");

const localPinboardHostname = "pinboard.local.dev-gutools.co.uk";

const readCertFile = (extension) =>
  fs.readFileSync(
    path.join(
      process.env.HOME,
      `/.gu/mkcert/${localPinboardHostname}.${extension}`
    )
  );

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";
  return {
    entry: "./src/entry.tsx",
    devtool: "source-map", // TODO consider different types of source map between dev & prod
    plugins: isDevelopment ? [new PreactRefreshPlugin()] : [],
    devServer: isDevelopment
      ? {
          allowedHosts: [".local.dev-gutools.co.uk"],
          server: {
            type: "https",
            options: {
              key: readCertFile("key"),
              cert: readCertFile("crt"),
            },
          },
          port: "auto",
          hot: "only",
          liveReload: false,
          devMiddleware: {
            writeToDisk: true, // so bootstrapping-lambda can find the main js filename
          },
          client: {
            webSocketURL: "wss://pinboard.local.dev-gutools.co.uk:8081/ws",
            overlay: true,
          },
        }
      : undefined,
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
};
