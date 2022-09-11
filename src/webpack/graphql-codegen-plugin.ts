import fs from 'fs'
import path from 'path'
import webpack from 'webpack'

import { codegen } from '@graphql-codegen/core'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { sync as glob } from 'glob'
import * as typescriptPlugin from '@graphql-codegen/typescript'

// type PluginMap = {
//   [name: string]: CodegenPlugin
// }

type PluginOptions = {
  filename: string
  // plugins: Types.ConfiguredPlugin[]
  // schemaFile: string
  // documents: Types.DocumentFile[]
  // config: {
  //   [key: string]: any
  // }
  // pluginMap: PluginMap
  // skipDuplicateDocumentsValidation?: boolean
}


export class GraphQLCodeGenPlugin {
  constructor(public options: PluginOptions) {} 
  public apply(compiler: webpack.Compiler) {
    compiler.hooks.beforeCompile.tapPromise('graphql-codegen-webpack-plugin', async () => {
      const gqls = glob('./graphql/**/*.{gql,graphql}', {
        root: compiler.context,
      })
      const schemas = gqls.map(file_path => {
        const content = fs.readFileSync(path.join(__dirname, file_path), 'utf-8')
        return content
      })
      const schema = mergeTypeDefs(schemas)

      const output = await codegen({
        documents: [],
        config: {},
        filename: path.join(__dirname, 'test.gql.ts'),

        schema,
        plugins: [
          // Each plugin should be an object
          {
            typescript: {} // Here you can pass configuration to the plugin
          }
        ],
        pluginMap: {
          typescript: typescriptPlugin
        }
      })

      // For Webpack watch mode. Don't write a generated file if its identical.
      let current: string = ''
      try {
        current = fs.readFileSync(this.options.filename, "utf-8")
      } catch (ex) { }

      if (output && current !== output) {
        fs.writeFileSync(this.options.filename, output, "utf-8")
      }
    })
  }
}
