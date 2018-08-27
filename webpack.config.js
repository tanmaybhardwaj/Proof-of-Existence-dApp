const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./app/javascripts/app.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "app.js"
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: "./app/index.html", to: "index.html" },
      { from: "./app/all-proofs.html", to: "all-proofs.html" },
      { from: "./app/add-proof.html", to: "add-proof.html" },
      { from: "./app/proof.html", to: "proof.html" }
    ])
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ],
    loaders: [
      { test: /\.json$/, use: "json-loader" },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        query: {
          presets: ["es2015"],
          plugins: ["transform-runtime"]
        }
      }
    ]
  }
};
