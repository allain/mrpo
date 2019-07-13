const sleepUntil = (test, interval = 1) =>
  new Promise(resolve => {
    const intervalId = setInterval(() => {
      if (test()) {
        clearTimeout(intervalId)
        resolve()
      }
    }, interval)
  })

class TestBuilder {
  constructor(targetPath, options = {}) {
    this.targetPath = targetPath
    this.options = options
    this._running = {}
  }
  async listCommands() {
    return ["hello", "forever", "error", "success"]
  }

  async start(commandName, args = {}) {
    this._running[commandName] = true
    switch (commandName) {
      case "hello":
        console.log("HELLO with args", JSON.stringify(args))
        break
      case "forever":
        let tick = 0
        await sleepUntil(() => {
          if (this._running[commandName]) {
            console.log(++tick)
          } else {
            return true
          }
        }, args.interval || 1)
        break
      case "success":
        break
      case "error":
        throw new Error("error")
    }

    delete this._running[commandName]
  }

  async stop(commandName) {
    if (this._running[commandName]) {
      // This will cause the sleepTill loop to terminate
      delete this._running[commandName]
    }
  }
}

module.exports = TestBuilder
