import path from 'node:path'
import fs from 'node:fs'
import webpack from 'webpack'
import NodeHmrPlugin from 'node-hmr-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import { GraphQLCodeGenPlugin } from './graphql-codegen-plugin.js'

export function create_config(): webpack.Configuration {
  const node_env = process.env['NODE_ENV']
  const is_prod = node_env === 'production'

  const pkg_path = path.join(__dirname, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkg_path, 'utf-8'))
  const libs = pkg['dependencies']
  const lib_keys = Object.keys(libs)
  lib_keys.push('supports-color')
  lib_keys.push('_http_common')
  lib_keys.push('encoding')
  lib_keys.push('util/types')
  lib_keys.push('database')
  const externals = is_prod ? [] : lib_keys.map(lib => ({ [`${lib}`]: `commonjs2 ${lib}` }))

  return {
    mode: is_prod ? 'production' : 'development',
    devtool: 'source-map',
    stats: is_prod ? 'errors-warnings' : 'normal',
    cache: !is_prod ? {
      type: 'filesystem',
      cacheDirectory: path.join(__dirname, '.webpack-cache')
    } : false,
    entry: [
      !is_prod ? 'webpack/hot/poll?1000' : '',
      path.join(__dirname, 'app.ts'),
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {},
          }
        },
        {
          test: /\.(graphql|gql)$/,
          use: {
            loader: 'graphql-tag/loader'
          },
          // type: 'asset/source',
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.json', '.jsx', '.wasm'],
      alias: {
        lib: path.join(__dirname, 'lib'),
      },
    },
    externalsPresets: { node: true },
    externals: [
      'webpack/hot/poll',
      ...externals,
      { '../database/db': `require('../../database/db')` },
      { '../../database/db': `require('../../database/db')` },
    ],
    plugins: [
      new GraphQLCodeGenPlugin({
        filename: path.join(__dirname, 'lib', 'graphql.ts'),
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!is_prod),
      }),
      new CleanWebpackPlugin(),
      !is_prod && new webpack.HotModuleReplacementPlugin(),
      !is_prod && new NodeHmrPlugin.default(),
    ].filter(Boolean) as any
  }
}
