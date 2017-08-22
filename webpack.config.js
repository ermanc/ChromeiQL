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
        test: /\.(js|jsx|flow)$/,
        loader: 'babel-loader',
        options: {
          plugins: ['transform-object-rest-spread'],
          presets: ['env', 'react']
        }
      }
    ]
  }
};

module.exports = config;
