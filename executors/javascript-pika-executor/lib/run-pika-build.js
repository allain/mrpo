const execa = require("execa")
const fs = require("fs-extra")
const path = require("path")

const resolveBin = require("../lib/resolve-bin")

const packBin = resolveBin("pack")
/**
 *
 * @param {string} buildPath
 * @param {string} distPath
 * @returns {import('execa').ExecaChildProcess}
 */
function runPikaBuild(buildPath, distPath) {
  const execution = execa(packBin, ["build", "--silent", "--cwd", buildPath])
  execution.stdout.pipe(process.stdout)
  execution.stderr.pipe(process.stderr)

  execution.then(async () => {
    await fs.remove(distPath)
    await fs.move(path.resolve(buildPath, "pkg"), distPath)
  })

  return execution
}

module.exports = runPikaBuild
