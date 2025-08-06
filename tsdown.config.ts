import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  dts: true,
  format: ['esm', 'iife', 'cjs'],
  outputOptions: {
    name: 'MTP',
    globals: {
      three: 'three',
    },
  },
})
