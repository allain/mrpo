const MrPo = require("..")
const path = require("path")
const collect = require("collect-console")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const debug = require("debug")("mrpo:test")
describe("mrpo", () => {
  it("rejects if it cannot determine executor", async () => {
    return expect(
      MrPo.build({
        name: "test",
        version: "1.0.0"
      })
    ).rejects.toThrow("invalid executor spec: undefined")
  })

  it("rejects if build param is not object or string", async () => {
    await expect(MrPo.build(true)).rejects.toThrow("invalid MrPo config: true")
    await expect(MrPo.build(false)).rejects.toThrow(
      "invalid MrPo config: false"
    )
    await expect(MrPo.build(null)).rejects.toThrow("invalid MrPo config: null")
    await expect(MrPo.build()).rejects.toThrow("invalid MrPo config: undefined")
  })

  it("rejects if project path does not exist", async () => {
    return expect(
      MrPo.build(path.resolve(__dirname, "test-fixtures/test-missing"))
    ).rejects.toThrow(/^could not find mrpo.json file in .*test-missing.*$/)
  })

  it("rejects if project path does not contain mrpo.json file", async () => {
    return expect(
      MrPo.build(path.resolve(__dirname, "test-fixtures/test-missing-mrpo"))
    ).rejects.toThrow(
      /^could not find mrpo.json file in .*test-missing-mrpo.*$/
    )
  })

  it("can be constructed by passing path to mrpo project", async () => {
    const mrpo = await MrPo.build(
      path.resolve(__dirname, "test-fixtures", "test-pkg")
    )

    return expect(await mrpo.listCommands()).toEqual([
      "asyncError",
      "asynchronous",
      "forever",
      "syncError",
      "synchronous"
    ])
  })

  it("can be constructed by passing multiple mrpo executors", async () => {})

  it("can be constructed by passing an object for config", async () => {
    const mrpo = await MrPo.build({
      cwd: "/tmp",
      name: "test",
      version: "1.0.0",
      executor: path.resolve(__dirname, "test-executor")
    })
    return expect(mrpo).toBeDefined()
  })

  it("returns command names in alphabetical order", async () => {
    const mrpo = await MrPo.build({
      cwd: "/tmp",
      name: "test",
      version: "1.0.0",
      executor: require("./test-executor")
    })

    const commandNames = await mrpo.listCommands()
    return expect([...commandNames]).toEqual(commandNames.sort())
  })

  it("works when executor is given as path to executor", async () => {
    const mrpo = await MrPo.build({
      cwd: "/tmp",
      name: "test",
      version: "1.0.0",
      executor: path.resolve(__dirname, "./test-executor")
    })

    const commandNames = await mrpo.listCommands()
    return expect(commandNames).not.toHaveLength(0)
  })

  it("exposes exec command", async () => {
    const mrpo = await MrPo.build({
      cwd: "/tmp",
      name: "test",
      version: "1.0.0",
      executor: require("./test-executor")
    })
    expect(mrpo.exec).toBeInstanceOf(Function)
    const execResult = mrpo.exec("synchronous")
    expect(execResult.then).toBeInstanceOf(Function)
    expect(execResult.catch).toBeInstanceOf(Function)
    expect(execResult.cancel).toBeInstanceOf(Function)
    return execResult
  })

  it("actually calls methods on executor when exec is performed", async () => {
    const executor = require("./test-executor")
    executor.synchronous = jest.fn(executor.synchronous)
    const config = {
      cwd: "/tmp",
      name: "test",
      version: "1.0.0",
      executor
    }
    const mrpo = await MrPo.build(config)

    await mrpo.exec("synchronous")
    return expect(executor.synchronous).toHaveBeenCalledWith(config, {})
  })

  it("canceling an exec causes result promise to resolve", async () => {
    const mrpo = await MrPo.build({
      cwd: "/tmp",
      name: "test",
      version: "1.0.0",
      executor: require("./test-executor")
    })

    const execution = mrpo.exec("forever", { interval: 1 })
    await sleep(20)
    execution.cancel()
    return execution
  })
})
