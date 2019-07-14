const fs = require("fs-extra")
const path = require("path")

const extractExternalDeps = require("../lib/extract-external-deps")

module.exports = async function deps(config) {
  const entryPath = path.resolve(config.cwd, "src", "index.js")
  const deps = await extractExternalDeps(entryPath)
  console.log(deps.join("\n"))
}
