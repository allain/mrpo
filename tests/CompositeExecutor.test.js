const Executor = require("../src/Executor")
const SimpleExecutor = require("../src/SimpleExecutor")
const CompositeExecutor = require("../src/CompositeExecutor")
const collect = require("collect-console")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * @param {string} name
 */
function buildForeverAction(name) {
  return {
    stopped: false,
    start({ interval }) {
      return new Promise(resolve => {
        this.stopped = false
        const intervalId = setInterval(() => {
          console.log(name)
          if (this.stopped) {
            clearTimeout(intervalId)
            resolve()
          }
        }, interval || 1)
      })
    },
    stop() {
      this.stopped = true
    }
  }
}

describe("CompositeExecutor", () => {
  it("can be created with a single executor", () => {
    const executorConfig = {
      test: jest.fn()
    }

    const executor = new SimpleExecutor(executorConfig)

    const composite = new CompositeExecutor([executor])
    expect(composite).toBeInstanceOf(Executor)
  })

  it("can turn objects into SimpleExecutors", async () => {
    const composite = new CompositeExecutor([{ test() {} }])
    expect(composite).toBeInstanceOf(Executor)
    expect(await composite.listCommands()).toEqual(["test"])
  })

  it("only returns unique command names", async () => {
    // a is duplicate
    const composite = new CompositeExecutor([{ a() {} }, { a() {}, b() {} }])
    expect(composite).toBeInstanceOf(Executor)
    expect(await composite.listCommands()).toEqual(["a", "b"])
  })

  it("executes all composed commands", async () => {
    const e1 = { test: jest.fn(() => 1) }
    const e2 = {
      test: {
        start: jest.fn(async () => 2),
        stop() {}
      }
    }

    const composite = new CompositeExecutor([e1, e2])
    await composite.exec("test")
    expect(e1.test).toHaveBeenCalled()
    expect(e2.test.start).toHaveBeenCalled()
  })

  it("supports running parallel cancelable commands", async () => {
    const e1 = { test: buildForeverAction("A") }
    const e2 = { test: buildForeverAction("B") }

    const composite = new CompositeExecutor([e1, e2])
    const output = await collect.log(async () => {
      const execution = composite.exec("test")
      await sleep(100)
      execution.cancel()
      return execution
    })
    expect(output.filter(line => line === "A").length).toBeGreaterThan(10)
    expect(output.filter(line => line === "B").length).toBeGreaterThan(10)
  })

  it("supports running a combination of forever and finite actions", async () => {
    const e1 = { test: buildForeverAction("A") }
    const e2 = {
      test() {
        console.log("B")
      }
    }
    const e3 = {
      async test() {
        console.log("C")
      }
    }

    const composite = new CompositeExecutor([e1, e2, e3])
    const output = await collect.log(async () => {
      const execution = composite.exec("test")
      await sleep(100)
      execution.cancel()
      return execution
    })
    expect(output.filter(line => line === "A").length).toBeGreaterThan(10)
    expect(output.filter(line => line === "B").length).toEqual(1)
    expect(output.filter(line => line === "C").length).toEqual(1)
  })
})
