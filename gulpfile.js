/**
 * @Author: Caven Chen
 * @Date: 2024-04-26
 */

'use strict'

import fse from 'fs-extra'
import path from 'path'
import gulp from 'gulp'
import tsup from 'tsup'
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

async function buildModules(options = {}) {
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
      await regenerate()
    })
    .on('change', async () => {
      let now = new Date().getTime()
      await regenerate()
      shell.echo(
        chalk.green(`regenerate lib takes ${new Date().getTime() - now} ms`)
      )
    })
  return watcher
})

export const build = gulp.series(() => buildModules())

export const buildRelease = gulp.series(() => buildModules({ minify: true }))
