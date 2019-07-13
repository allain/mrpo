const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo")
const chalk = require("chalk")

class MrPoException extends Error {
  constructor(message, context = {}) {
    super(message)
    Object.assign(this, context)
  }
}

/**
 * @typedef {Object} Execution
 * @property {Function} stop
 * @property {Promise} result
 */

class MrPo {
  constructor(targetDir, config) {
    this._config = config
    this._targetDir = targetDir
    this._bundler = this.prepareBundler()
  }

  async prepareBundler() {
    if (typeof this._config.bundler === "string") {
      const bundlerPath = require.resolve(
        path.resolve(this._targetDir, this._config.bundler)
      )

      if (await fs.pathExists(bundlerPath)) {
        const Bundler = require(bundlerPath)
        debug("using building at %s", chalk.green(bundlerPath))
        return new Bundler(this._targetDir, this._config)
      }
    } else if (typeof this._config.bundler === "object") {
      return this._config.bundler
    }

    throw new Error(`invalid bundler spec: ${this._config.bundler}`)
  }

  async listCommands() {
    const bundler = await this._bundler
    return bundler.listCommands()
  }

  /**
   *
   * @param {string} commandName
   * @param {Object.<string,any>} args
   * @returns {Promise<Execution>}
   */
  async exec(commandName, args = {}) {
    const bundler = await this._bundler
    const result = bundler.start(commandName, args)

    if (debug.enabled) {
      result.then(() => {
        debug(
          chalk.green("command %s finished with success"),
          chalk.bold(commandName)
        ),
          err => {
            debug(
              chalk.red("command %s finished with error %o", err),
              chalk.bold(commandName)
            )
            throw err
          }
      })
    }

    return {
      result,
      stop() {
        return bundler.stop(commandName)
      }
    }
  }
}

module.exports = {
  async build(...args) {
    let targetDir
    let info = {}

    if (typeof args[0] === "string") {
      targetDir = args[0]
      info = args[1] || {}
      if (!targetDir.match(/\/$/)) {
        targetDir += "/"
      }
      const mrpoConfigPath = path.resolve(targetDir, "mrpo.json")
      if (!(await fs.pathExists(mrpoConfigPath))) {
        throw new MrPoException(
          `could not find mrpo.json file in ${targetDir}`,
          {
            targetDir
          }
        )
      }

      info = JSON.parse(await fs.readFile(mrpoConfigPath, "utf-8"))
    } else {
      info = { ...args[0] }
      targetDir = args[0].targetDir
      if (!targetDir) {
        throw new Error(
          "targetDir property must be given when building MrPo from object"
        )
      }
      delete info.targetDir
    }

    return new MrPo(targetDir, info)
  }
}
