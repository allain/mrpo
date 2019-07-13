const execa = require("execa")
const os = require("os")
const fs = require("fs-extra")
const path = require("path")

const randomInt = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
const generateBuildPath = name =>
  path.resolve(os.tmpdir(), `${name}-${Date.now()}-${randomInt()}`)

const resolveBin = name => path.resolve(__dirname, "node_modules", ".bin", name)
const resolveBuildPackage = id =>
  require.resolve(id, {
    paths: [__dirname]
  })

class JavaScriptPkgBundler {
  constructor(targetDir, config = {}) {
    this.targetDir = targetDir
    this.config = config

    /** @type {Object.<string, import('execa').ExecaChildProcess>} */
    this._running = {}
  }

  async listCommands() {
    return ["build"]
  }

  async start(commandName, args = {}) {
    switch (commandName) {
      case "build":
        return this.build(args)
      default:
        throw new Error(`Invalid command ${commandName}`)
    }
  }

  async stop(commandName) {
    if (this._running[commandName]) {
      // This will be an execa execution instance
      this._running[commandName]
    }
  }

  async build(args) {
    const packBin = resolveBin("pack")

    const buildPath = generateBuildPath(this.config.name)
    await fs.ensureDir(buildPath)
    const packageJsonPath = path.resolve(buildPath, "package.json")

    await fs.ensureSymlink(
      path.resolve(this.targetDir, "src"),
      path.resolve(buildPath, "src")
    )

    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(
        {
          name: this.config.name,
          version: this.config.version,
          main: path.resolve(buildPath, "src", "index.js"),
          "@pika/pack": {
            pipeline: [
              [
                resolveBuildPackage("@pika/plugin-standard-pkg"),
                { exclude: ["tests/**/*", "**/*.test.*", "**/*.json"] }
              ],
              [resolveBuildPackage("@pika/plugin-build-node")],
              [resolveBuildPackage("@pika/plugin-build-web")]
              // [resolveBuildPackage("@pika/plugin-build-types")]
            ]
          }
        },
        null,
        2
      )
    )

    const execution = (this._running.build = execa(packBin, [
      "build",
      "--cwd",
      buildPath
    ]))
    execution.stdout.pipe(process.stdout)
    execution.stderr.pipe(process.stderr)
    await execution

    execution.on("exit", () => {
      this._running.build = null
    })

    const distPath = path.resolve(this.targetDir, "dist")
    await fs.remove(distPath)
    await fs.move(path.resolve(buildPath, "pkg"), distPath)
    await fs.remove(buildPath)
  }
}

module.exports = JavaScriptPkgBundler
