const execa = require("execa")
const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo:javacsript-pika-executor")
const runPikaBuild = require("../lib/run-pika-build")
const buildProject = require("../lib/build-project")
const deployNodeModules = require("../lib/deploy-node-modules")

module.exports = {
  /** @type {import('execa').ExecaChildPromise} */
  execution: null,
  async start(config) {
    debug("generating build source")
    const buildPath = await buildProject(config)
    debug("generated at %s", buildPath)

    debug("deploying node_modules")
    await deployNodeModules(buildPath, config)
    debug("done")

    const execution = runPikaBuild(buildPath, path.resolve(config.cwd, "dist"))
    execution.on("exit", () => {
      this.execution = null
    })
    await execution

    if (config.keep) {
      debug("keeping build project")
    } else {
      debug("destroying build project")
      // await fs.remove(buildPath)
    }
  },

  async stop() {
    if (this.execution) {
      this.execution.cancel()
      this.execution = null
    }
  }
}
