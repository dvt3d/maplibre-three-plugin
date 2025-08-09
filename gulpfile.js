/**
 * @Author: Caven Chen
 * @Date: 2024-04-26
 */

'use strict'

import fse from 'fs-extra'
import path from 'path'
import gulp from 'gulp'
import tsup from 'tsup'
import GlobalsPlugin from 'esbuild-plugin-globals'
import shell from 'shelljs'
import chalk from 'chalk'

const buildConfig = {
  entryPoints: ['src/index.ts'],
  dts: true,
  target: `es2022`,
  minify: false,
  sourcemap: false,
  external: ['three'],
  splitting: false,
}

async function buildModules(options) {
  // Build IIFE
  if (options.iife) {
    await tsup.build({
      ...buildConfig,
      format: 'iife',
      globalName: 'MTP',
      minify: options.minify,
      esbuildPlugins: [
        GlobalsPlugin({
          three: 'THREE',
        }),
      ],
      esbuildOptions: (options, context) => {
        delete options.outdir
        options.outfile = path.join('dist', 'mtp.min.js')
      },
    })
  }
  // Build Node
  if (options.node) {
    await tsup.build({
      ...buildConfig,
      format: 'esm',
      minify: options.minify,
      esbuildOptions: (options, context) => {
        delete options.outdir
        options.outfile = path.join('dist', 'index.js')
      },
    })
  }
}

async function regenerate(option, content) {
  await fse.remove('dist/index.js')
  await buildModules(option)
}

export const dev = gulp.series(() => {
  shell.echo(chalk.yellow('============= start dev =============='))
  const watcher = gulp.watch('src', {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  })
  watcher
    .on('ready', async () => {
      await regenerate({ node: true })
    })
    .on('change', async () => {
      let now = new Date().getTime()
      await regenerate({ node: true })
      shell.echo(
        chalk.green(`regenerate lib takes ${new Date().getTime() - now} ms`)
      )
    })
  return watcher
})

export const buildIIFE = gulp.series(() => buildModules({ iife: true }))

export const buildNode = gulp.series(() => buildModules({ node: true }))

export const build = gulp.series(
  () => buildModules({ iife: true }),
  () => buildModules({ node: true })
)

export const buildRelease = gulp.series(
  () => buildModules({ iife: true, minify: true }),
  () => buildModules({ node: true, minify: true })
)
