const webpack = require('webpack');
const path = require('path');

// webpack.config.js
module.exports = {
  entry: {
    "wxSocket": path.join(__dirname, 'index.ts'),
    "wxSocket.min": path.join(__dirname, 'index.ts')
  },
  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.coffee', '.js', '.ts']
  },
  module: {
    loaders: [
      {test: /\.tsx?$/, loader: 'ts-loader'}
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {warnings: false},
      sourceMap: false,
      test: /\.min\.js$/
    })
  ]
};