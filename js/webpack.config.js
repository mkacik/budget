const path = require("path");

module.exports = {
  entry: "./src/App.tsx",
  output: {
    path: path.resolve(__dirname, "../www"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".css"],
  },
};
