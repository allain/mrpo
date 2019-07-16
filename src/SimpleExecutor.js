const CancelablePromise = require("p-cancelable")
const Executor = require("./Executor")
const isObject = require("./lib/is-object")

class SimpleExecutor extends Executor {
  constructor(commands, config = {}) {
    super()

    if (!isObject(commands)) {
      if (Array.isArray(commands)) {
        throw new TypeError(
          "command map may not be an array. Did you mean to use a CompositeExecutor?"
        )
      } else {
        throw new TypeError(`invalid command map: ${JSON.stringify(commands)}`)
      }
    }
    this._commands = commands
    this._config = config
  }

  async listCommands() {
    return Object.keys(this._commands)
  }

  /**
   *
   * @param {string} commandName
   * @param {object} [args]
   * @returns {CancelablePromise}
   */
  exec(commandName, args = {}) {
    return new CancelablePromise(async (resolve, reject, onCancel) => {
      onCancel.shouldReject = false
      const command = this._commands[commandName]

      if (typeof command === "function") {
        let result
        try {
          await Promise.resolve().then(() => {
            result = command(this._config, args)
          })
        } catch (err) {
          result = Promise.reject(err)
        }

        if (result && result.then) {
          if (typeof result["cancel"] === "undefined") {
            onCancel(() => reject(new Error("command cannot be stopped")))
          } else {
            onCancel(() => result.cancel())
          }

          result.then(resolve, reject)
        } else {
          resolve(result)
        }
      } else if (isObject(command)) {
        console.assert(
          typeof command.start === "function",
          "command config object must contain start method"
        )
        console.assert(
          typeof command.stop === "function",
          "command config object must contain stop method"
        )

        let result = null
        try {
          result = command.start(this._config, args)
          onCancel(() => command.stop())
        } catch (err) {
          reject(err)
          return
        }

        result && result.then ? result.then(resolve, reject) : resolve(result)
      } else {
        reject(new Error(`invalid command "${commandName}"`))
      }
    })
  }
}

module.exports = SimpleExecutor
