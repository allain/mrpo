const Executor = require("./Executor")
const SimpleExecutor = require("./SimpleExecutor")
const CancelablePromise = require("p-cancelable")
const isObject = require("./lib/is-object")

class CompositeExecutor extends Executor {
  constructor(executors = []) {
    super()

    this._executors = executors.map(this._prepareExecutor)
    this._commandsMap = null
  }

  _prepareExecutor(executor) {
    if (!isObject(executor)) {
      throw new Error(
        `invalid executor provided for composition: ${JSON.stringify(executor)}`
      )
    }

    return executor instanceof Executor
      ? executor
      : new SimpleExecutor(executor)
  }

  async _buildCommandsMap() {
    if (this._commandsMap == null) {
      // Get all the commands in parallel
      const executorsCommands = await Promise.all(
        this._executors.map(async executor => ({
          executor,
          commands: await executor.listCommands()
        }))
      )

      const commandsMap = {}

      for (const { executor, commands } of executorsCommands) {
        for (const command of commands) {
          if (commandsMap[command]) {
            commandsMap[command].push(executor)
          } else {
            commandsMap[command] = [executor]
          }
        }
      }

      return commandsMap
    }

    return this._commandsMap
  }

  async _lookupCommandExecutors(commandName) {
    const commandsMap = await this._buildCommandsMap()
    return commandsMap[commandName] || []
  }

  async listCommands() {
    const commandsMap = await this._buildCommandsMap()
    return Object.keys(commandsMap).sort()
  }

  /**
   *
   * @param {string} commandName
   * @param {object} [args]
   * @returns {CancelablePromise}
   */
  exec(commandName, args = {}) {
    return new CancelablePromise(async (resolve, reject, onCancel) => {
      const executors = await this._lookupCommandExecutors(commandName)
      if (executors.length === 0) {
        reject(new Error("no executors found for command: " + commandName))
        return
      }

      const allExecutions = executors.map(executor =>
        executor.exec(commandName, args)
      )

      onCancel.shouldReject = false
      onCancel(() => allExecutions.forEach(executor => executor.cancel()))

      Promise.all(allExecutions).then(resolve, reject)
    })
  }
}

module.exports = CompositeExecutor
