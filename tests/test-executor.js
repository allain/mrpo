module.exports = {
  synchronous() {},
  async asynchronous() {},
  forever: {
    stopped: false,
    start({ interval }) {
      return new Promise(resolve => {
        const intervalId = setInterval(() => {
          if (this.stopped) {
            clearTimeout(intervalId)
            resolve()
          }
          this.stopped = false
        }, interval || 1)
      })
    },
    stop() {
      this.stopped = true
    }
  },
  async asyncError() {
    throw new Error("error")
  },
  syncError() {
    throw new Error("error")
  }
}
