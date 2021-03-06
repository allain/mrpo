const SimpleExecutor = require("../src/SimpleExecutor")
const CancelablePromise = require("p-cancelable")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe("Executor", () => {
  it("should thrown when commands map is not an object", () => {
    expect(() => new SimpleExecutor()).toThrow(
      /^invalid command map: undefined$/
    )
    expect(() => new SimpleExecutor(false)).toThrow(
      /^invalid command map: false$/
    )
    expect(() => new SimpleExecutor([])).toThrow(
      "command map may not be an array. Did you mean to use a CompositeExecutor?"
    )
  })

  it("can be created empty", async () => {
    const executor = new SimpleExecutor({})
    return expect(await executor.listCommands()).toEqual([])
  })

  it("supports simple commands which are not cancellable", async () => {
    const executor = new SimpleExecutor({
      noop: async () => {}
    })

    const execution = executor.exec("noop")
    expect(execution.then).toBeInstanceOf(Function)
    expect(execution.catch).toBeInstanceOf(Function)
    expect(execution.cancel).toBeInstanceOf(Function)
    return execution
  })

  it("supports simple synchronous commands", async () => {
    let calls = 0
    const executor = new SimpleExecutor({
      synchronous() {
        calls++
      }
    })

    const result = executor.exec("synchronous")
    expect(calls).toEqual(0) // Does not call command immediately on exec
    // result is async even if action is synchronous
    expect(result.then).toBeInstanceOf(Function)
    await result
    return expect(calls).toEqual(1) // does eventually call command
  })

  it("supports simple asynchronous commands", async () => {
    let calls = 0
    const executor = new SimpleExecutor({
      async synchronous() {
        calls++
      }
    })

    const result = executor.exec("synchronous")
    expect(result.then).toBeInstanceOf(Function)
    await result
    return expect(calls).toEqual(1) // does eventually call command
  })

  it("supports {start,stop} commands", async () => {
    let ticks = 0

    const executor = new SimpleExecutor({
      fancy: {
        stopped: false,
        start() {
          this.stopped = false
          return new Promise(resolve => {
            const intervalId = setInterval(() => {
              ticks++
              if (this.stopped) {
                clearInterval(intervalId)
                resolve()
              }
            }, 1)
          })
        },
        stop() {
          this.stopped = true
        }
      }
    })

    const result = executor.exec("fancy")
    expect(result.then).toBeInstanceOf(Function)
    await sleep(100)
    await result.cancel()
    await result
    return expect(ticks).toBeGreaterThan(5)
  })

  it("supports returning CancelablePromise from simple command", async () => {
    let ticks = 0

    const executor = new SimpleExecutor({
      fancy() {
        return new CancelablePromise((resolve, _, onCancel) => {
          onCancel.shouldReject = false
          let stopped = false
          const intervalId = setInterval(() => {
            ticks++
            if (stopped) {
              clearInterval(intervalId)
              resolve()
            }
          }, 1)
          onCancel(() => (stopped = true))
        })
      }
    })

    const result = executor.exec("fancy")
    expect(result.then).toBeInstanceOf(Function)
    await sleep(20)
    await result.cancel()
    await result
    await expect(ticks).toBeGreaterThan(5)
  })

  it("rejects when synchronous action throws", async () => {
    const executor = new SimpleExecutor({
      throwy() {
        throw new Error("Test")
      }
    })

    await expect(executor.exec("throwy")).rejects.toThrow("Test")
  })

  it("rejects when synchronous start action throws", async () => {
    const executor = new SimpleExecutor({
      throwy: {
        start() {
          throw new Error("Test")
        },
        stop() {}
      }
    })

    await expect(executor.exec("throwy")).rejects.toThrow("Test")
  })

  it("rejects when commadn is neither function nor object", () => {
    const executor = new SimpleExecutor({
      invalid: []
    })

    return expect(executor.exec("invalid")).rejects.toThrow(
      'invalid command "invalid"'
    )
  })
})
