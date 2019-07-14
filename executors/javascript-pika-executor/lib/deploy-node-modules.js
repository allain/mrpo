const path = require("path")
const fs = require("fs-extra")
const execa = require("execa")
const debug = require("debug")("mrpo:javascript-pika-executor")

async function deployNodeModules(buildPath, config) {
  debug("installing node modules")
  const installing = execa("npm", ["install", "--save"], { cwd: buildPath })
  installing.stdout.pipe(process.stdout)
  installing.stderr.pipe(process.stderr)
  await installing

  const targetNodeModules = path.resolve(config.cwd, "node_modules")
  if (await fs.pathExists(targetNodeModules)) {
    await fs.remove(targetNodeModules)
  }
  await fs.move(
    path.resolve(buildPath, "node_modules"),
    path.resolve(config.cwd, "node_modules")
  )
}

module.exports = deployNodeModules
