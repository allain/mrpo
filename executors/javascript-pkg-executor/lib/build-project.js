const os = require("os")
const fs = require("fs-extra")
const path = require("path")
const resolveBuildPackage = require("./resolve-build-package")

const randomInt = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
const generateBuildPath = name =>
  path.resolve(os.tmpdir(), `${name}-${Date.now()}-${randomInt()}`)

module.exports = async function buildProject(config) {
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

  return buildPath
}
