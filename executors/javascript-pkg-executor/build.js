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

module.exports = {
  /** @type {import('execa').ExecaChildPromise} */
  execution: null,
  async start(args, config) {
    const packBin = resolveBin("pack")

    const buildPath = generateBuildPath(config.name)
    await fs.ensureDir(buildPath)
    const packageJsonPath = path.resolve(buildPath, "package.json")

    await fs.ensureSymlink(
      path.resolve(config.cwd, "src"),
      path.resolve(buildPath, "src")
    )

    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(
        {
          name: config.name,
          version: config.version,
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

    const execution = (this.execution = execa(packBin, [
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

    const distPath = path.resolve(config.cwd, "dist")
    await fs.remove(distPath)
    await fs.move(path.resolve(buildPath, "pkg"), distPath)
    await fs.remove(buildPath)
  },
  async stop() {
    this.execution.kill()
  }
}
