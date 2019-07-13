const MrPo = require("..")
const path = require("path")
const collect = require("collect-console")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const debug = require("debug")("mrpo:test")
describe("mrpo", () => {
  it("can be constructed by passing an object for config", async () => {
    const output = await collect.log(async () => {
      const mrpo = await MrPo.build({
        targetDir: "/tmp",
        name: "test",
        version: "1.0.0",
        bundler: path.resolve(__dirname, "test-bundlers", "test-bundler")
      })
      const execution = await mrpo.exec("hello")
      return execution.result
    })
    expect(output).toEqual(["HELLO with args {}"])
  })

  it("rejects when build config object does not contain targetDir", async () => {
    return expect(
      MrPo.build({
        name: "test",
        version: "1.0.0",
        bundler: path.resolve(__dirname, "test-bundlers", "test-bundler")
      })
    ).rejects.toThrow(
      "targetDir property must be given when building MrPo from object"
    )
  })

  it("bundler can be an object passed into MrPo.build", async () => {
    const output = await collect.log(async () => {
      const mrpo = await MrPo.build({
        targetDir: "/tmp",
        name: "test",
        version: "1.0.0",
        bundler: {
          async listCommands() {
            return "test"
          },
          async start(commandName) {
            console.log(commandName)
          }
        }
      })
      const execution = await mrpo.exec("test")
      return execution.result
    })

    expect(output).toEqual(["test"])
  })

  it("exposes listCommands", async () => {
    const mrpo = await MrPo.build(
      path.resolve(__dirname, "test-fixtures", "test-pkg")
    )
    expect(mrpo.listCommands).toBeInstanceOf(Function)
    const commandsResult = mrpo.listCommands()
    expect(commandsResult).toBeInstanceOf(Promise)
    const commands = await commandsResult
    expect(Array.isArray(commands)).toBe(true)
  })

  it("queries bundler for commands", async () => {
    const mrpo = await MrPo.build(
      path.resolve(__dirname, "test-fixtures", "test-pkg")
    )
    expect(await mrpo.listCommands()).toEqual([
      "hello",
      "forever",
      "error",
      "success"
    ])
  })

  it("exposes exec command", async () => {
    const mrpo = await MrPo.build(
      path.resolve(__dirname, "test-fixtures", "test-pkg")
    )
    expect(mrpo.exec).toBeInstanceOf(Function)
    const execResult = mrpo.exec("succeed")
    expect(execResult).toBeInstanceOf(Promise)
    const execution = await execResult
    expect(execution.result).toBeInstanceOf(Promise)
    expect(execution.stop).toBeInstanceOf(Function)
  })

  it("actually calls start on bundler when exec is performed", async () => {
    const output = await collect.log(async () => {
      const mrpo = await MrPo.build(
        path.resolve(__dirname, "test-fixtures", "test-pkg")
      )
      const execution = await mrpo.exec("hello")
      return execution.result
    })
    expect(output).toHaveLength(1)
    expect(output).toEqual(["HELLO with args {}"])
  })

  it("actually calling stop() causes result promise to resolve", async () => {
    const mrpo = await MrPo.build(
      path.resolve(__dirname, "test-fixtures", "test-pkg")
    )
    const execution = await mrpo.exec("forever", { interval: 1000 })
    await sleep(20)
    await execution.stop()
    return execution.result
  })
})
