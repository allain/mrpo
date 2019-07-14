const execa = require("execa")
const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo:javacsript-pkg-executor")
const chokidar = require("chokidar")

const buildProject = require("../lib/build-project")
const resolveBin = require("../lib/resolve-bin")

module.exports = {
  stopper: null,
  /** @type {import('execa').ExecaChildPromise} */
  buildingProcess: null,
  async start(config) {
    debug("generating build source")
    const buildPath = await buildProject(config)
    debug("generated at %s", buildPath)

    const packBin = resolveBin("pack")

    const watcher = chokidar.watch(path.resolve(config.cwd, "src"))
    console.log("performing initial build")
    await build()

    console.log("listening for changes")

    watcher.on("change", (changedPath, stats) => {
      if (this.buildingProcess) {
        this.buildingProcess.cancel()
      }
      build()
    })

    async function build() {
      const execution = (this.buildingProcess = execa(packBin, [
        "build",
        "--cwd",
        buildPath
      ]))
      execution.stdout.pipe(process.stdout)
      execution.stderr.pipe(process.stderr)
      await execution

      execution.on("exit", () => {
        this.buildingProcess = null
      })
    }

    await new Promise(resolve => (this.stopper = resolve))

    watcher.close()

    const distPath = path.resolve(config.cwd, "dist")
    await fs.remove(distPath)
    await fs.move(path.resolve(buildPath, "pkg"), distPath)
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
