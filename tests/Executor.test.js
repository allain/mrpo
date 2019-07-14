const Executor = require("../src/Executor")
const CancelablePromise = require("p-cancelable")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe("Executor", () => {
  it("can be created empty", async () => {
    const executor = new Executor()
    expect(await executor.listCommands()).toEqual([])
  })

  it("supports simple commands which are not cancellable", async () => {
    const executor = new Executor({
      noop: async () => {}
    })

    const execution = executor.exec("noop")
    expect(execution.then).toBeInstanceOf(Function)
    expect(execution.catch).toBeInstanceOf(Function)
    expect(execution.cancel).toBeInstanceOf(Function)
  })

  it("supports simple synchronous commands", async () => {
    let calls = 0
    const executor = new Executor({
      synchronous() {
        calls++
      }
    })

    const result = executor.exec("synchronous")
    expect(calls).toEqual(0) // Does not call command immediately on exec
    // result is async even if action is synchronous
    expect(result.then).toBeInstanceOf(Function)
    await result
    expect(calls).toEqual(1) // does eventually call command
  })

  it("supports simple asynchronous commands", async () => {
    let calls = 0
    const executor = new Executor({
      async synchronous() {
        calls++
      }
    })

    const result = executor.exec("synchronous")
    expect(result.then).toBeInstanceOf(Function)
    await result
    expect(calls).toEqual(1) // does eventually call command
  })

  it("supports {start,stop} commands", async () => {
    let ticks = 0

    const executor = new Executor({
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
    await sleep(20)
    await result.cancel()
    await result
    expect(ticks).toBeGreaterThan(5)
  })

  it("supports returning CancelablePromise from simple command", async () => {
    let ticks = 0

    const executor = new Executor({
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
    expect(ticks).toBeGreaterThan(5)
  })

  it("rejects when synchronous action throws", async () => {
    const executor = new Executor({
      throwy() {
        throw new Error("Test")
      }
    })

    expect(executor.exec("throwy")).rejects.toThrow("Test")
  })

  it("rejects when synchronous start action throws", async () => {
    const executor = new Executor({
      throwy: {
        start() {
          throw new Error("Test")
        },
        stop() {}
      }
    })

    expect(executor.exec("throwy")).rejects.toThrow("Test")
  })

  it("rejects when commadn is neither function nor object", () => {
    const executor = new Executor({
      invalid: []
    })

    expect(executor.exec("invalid")).rejects.toThrow(
      'invalid command "invalid"'
    )
  })
})
