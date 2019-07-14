const execa = require("execa")
const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo:javacsript-pkg-executor")
const chokidar = require("chokidar")

const buildProject = require("../lib/build-project")
const resolveBin = require("../lib/resolve-bin")
const runPikaBuild = require("../lib/run-pika-build")
const DepsCollector = require("../lib/DepsCollector")
const deployNodeModules = require("../lib/deploy-node-modules")

module.exports = {
  stopper: null,

  /** @type {import('execa').ExecaChildPromise} */
  buildingProcess: null,

  async start(config) {
    debug("generating build source")
    const buildPath = await buildProject(config)
    const distPath = path.resolve(config.cwd, "dist")
    debug("generated at %s", buildPath)

    const collector = new DepsCollector()
    await collector.updateFile(path.resolve(config.cwd, "src", "index.js"))

    console.log("detected dependencies", collector.dependencies)
    const watcher = chokidar.watch(path.resolve(config.cwd, "src"))
    console.log("performing initial build")
    await build()

    console.log("listening for changes")

    watcher.on("change", async changedPath => {
      if (await collector.updateFile(changedPath)) {
        console.log("new external deps")
        const buildPath = await buildProject(config)

        debug("deploying node_modules")
        await deployNodeModules(buildPath, config)
        debug("done")
      }

      if (this.buildingProcess) {
        this.buildingProcess.cancel()
      }
      build()
    })

    async function build() {
      const execution = (this.buildProcess = runPikaBuild(buildPath, distPath))

      execution.on("exit", () => {
        this.buildingProcess = null
      })

      await execution
    }

    await new Promise(resolve => (this.stopper = resolve))

    watcher.close()
  },

  async stop() {
    if (this.buildingProcess) {
      this.buildingProcess.cancel()
      this.buildingProcess = null
    }

    if (this.stopper) {
      this.stopper()
      this.stopper = null
    }
  }
}
