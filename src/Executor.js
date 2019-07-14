const CancelablePromise = require("p-cancelable")

class Executor {
  constructor() {}

  /**
   * @returns {Promise<string[]>}
   */
  async listCommands() {
    throw new Error("AbstractMethod must be overriden")
  }

  /**
   *
   * @param {string} commandName
   * @param {object} [args]
   * @returns {CancelablePromise}
   */
  exec(commandName, args = {}) {
    throw new Error("abstract method must be overriden")
  }
}

module.exports = Executor
