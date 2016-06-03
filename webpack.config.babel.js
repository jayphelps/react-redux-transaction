import webpack from 'webpack';
import path from 'path';

import packageJSON from './package.json';

const { NODE_ENV } = process.env;

const plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
];

const filename = packageJSON.name + (NODE_ENV === 'production' ? '.min' : '') + '.js';

NODE_ENV === 'production'  && plugins.push(
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      screw_ie8: true,
      warnings: false,
    },
  })
);

export default {
  module: {
    loaders: [
      { test: /\.jsx?$/, loaders: ['babel'], exclude: /node_modules/ },
    ],
  },
  entry: [
    './src/index',
  ],
  externals: {
    'redux': {
      root: 'Redux',
      commonjs2: 'redux',
      commonjs: 'redux',
      amd: 'redux'
    },
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    },
    'react-redux': {
      root: 'ReactRedux',
      commonjs2: 'react-redux',
      commonjs: 'react-redux',
      amd: 'react-redux'
    },
    'redux-transaction': {
      root: 'ReduxTransaction',
      commonjs2: 'redux-transaction',
      commonjs: 'redux-transaction',
      amd: 'redux-transaction'
    }
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename,
    library: 'ReactReduxTransaction',
    libraryTarget: 'umd',
  },

  plugins,
};
