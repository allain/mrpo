const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo")
const chalk = require("chalk")
const CancelablePromise = require("p-cancelable")
const Executor = require("./Executor")
const SimpleExecutor = require("./SimpleExecutor")
const CompositeExecutor = require("./CompositeExecutor")
const execa = require("execa")
const isObject = require("./lib/is-object")

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
  /**
   *
   * @param {{cwd:string, executor:Executor, executors: Executor[], name:string, version:string}}options
   */
  constructor(options) {
    const { executor, executors, ...config } = options
    if (executor && executors)
      throw new MrPoException(
        "only executor or executors may be given at the same time"
      )
    this._executor = executors ? new CompositeExecutor(executors) : executor
    this._config = config
  }

  async listCommands() {
    const commandNames = await this._executor.listCommands()

    return commandNames.sort()
  }

  /**
   *
   * @param {string} commandName
   * @param {Object.<string,any>} args
   * @returns {CancelablePromise}
   */
  exec(commandName, args = {}) {
    return new CancelablePromise((resolve, reject, onCancel) => {
      /** @type {CancelablePromise} */
      const result = this._executor.exec(commandName, args)

      onCancel.shouldReject = false
      onCancel(() => result.cancel())
      result.then(resolve, reject)
    })
  }
}

/**
 * @param {object} info
 * @returns {Promise<Object>}
 */
async function prepareInfo(info) {
  // load config from mrpo.json file in target directory
  if (typeof info === "string") {
    let cwd = info
    const mrpoConfigPath = path.resolve(cwd, "mrpo.json")
    if (!(await fs.pathExists(mrpoConfigPath))) {
      throw new MrPoException(`could not find mrpo.json file in ${cwd}`, {
        cwd
      })
    }

    info = JSON.parse(await fs.readFile(mrpoConfigPath, "utf-8"))
    info.cwd = cwd
    return info
  } else if (isObject(info)) {
    info.cwd = info.cwd || process.cwd()
    return info
  }

  throw new MrPoException(`invalid MrPo config: ${JSON.stringify(info)}`, info)
}

async function prepareExecutor(info) {
  let { cwd, executor } = info
  if (typeof executor === "string") {
    try {
      const executorPath = require.resolve(executor, { paths: [cwd] })
      debug("using executor at %s", chalk.green(executorPath))
      executor = require(executorPath)
    } catch (err) {
      console.log("installing executor", executor)
      fs.ensureDir(path.resolve(cwd, "node_modules"))

      const installation = execa("npm", ["install", executor], { cwd })
      installation.stdout.pipe(process.stdout)
      installation.stderr.pipe(process.stderr)
      await installation

      const executorPath = require.resolve(executor, { paths: [cwd] })
      executor = require(executorPath)
    }
    executor = executor.default || executor
  }

  if (isObject(executor) && !(executor instanceof Executor)) {
    // executor is a commands map
    executor = new SimpleExecutor(executor, info)
  }

  if (!(executor instanceof Executor)) {
    throw new Error(`invalid executor spec: ${JSON.stringify(executor)}`)
  }

  return executor
}

module.exports = {
  async build(config) {
    const info = await prepareInfo(config)
    const executor = await prepareExecutor(info)

    return new MrPo({ ...info, executor })
  }
}
