const path = require('path');

const config = {
  entry: './js/chromeiql.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'chromeiql.js'
  },
  resolve: {
    modules: ['node_modules', 'js']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ['env']
        }
      }
    ]
  }
};

module.exports = config;
