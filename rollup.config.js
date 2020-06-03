import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser'

const BASE_CONFIG = {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**' // 只编译我们的源代码
    }),
    terser()
  ]
}
export default [
  // commonjs
  BASE_CONFIG,
  // esm
  Object.assign(
    {},
    BASE_CONFIG,
    {
      output: {
        file: 'bundle.esm.js',
        format: 'esm'
      }
    }
  )
]
