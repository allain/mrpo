const path = require("path")
const fs = require("fs-extra")
const execa = require("execa")

async function deployNodeModules(buildPath, config) {
  await execa("npm", ["install", "--save", "--silent"], { cwd: buildPath })

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
