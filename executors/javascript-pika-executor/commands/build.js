const execa = require("execa")
const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo:javacsript-pkg-executor")

const buildProject = require("../lib/build-project")
const resolveBin = require("../lib/resolve-bin")

module.exports = {
  /** @type {import('execa').ExecaChildPromise} */
  execution: null,
  async start(config) {
    debug("generating build source")
    const buildPath = await buildProject(config)
    debug("generated at %s", buildPath)

    const packBin = resolveBin("pack")

    const execution = (this.execution = execa(packBin, [
      "build",
      "--cwd",
      buildPath
    ]))
    execution.stdout.pipe(process.stdout)
    execution.stderr.pipe(process.stderr)
    await execution

    execution.on("exit", () => {
      this.execution = null
    })

    const distPath = path.resolve(config.cwd, "dist")
    await fs.remove(distPath)
    await fs.move(path.resolve(buildPath, "pkg"), distPath)
    if (config.keep) {
      debug("keeping build project")
    } else {
      debug("destroying build project")
      await fs.remove(buildPath)
    }
  },

  async stop() {
    if (this.execution) {
      this.execution.cancel()
      this.execution = null
    }
  }
}
