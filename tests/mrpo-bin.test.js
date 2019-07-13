const os = require("os")
const { prepareArgs } = require("../bin/mrpo-bin")

function buildTestArgs(argv) {
  return [process.argv[0], process.argv[0], ...argv]
}

describe("mrpo-bin", () => {
  it("handles empty args", async () => {
    expect(await prepareArgs(buildTestArgs([]))).toMatchObject({
      options: {},
      params: [],
      targetPath: /\/mrpo$/
    })
  })

  it("treats single argument as directory if it exists", async () => {
    const tmpDir = os.tmpdir()
    const prepared = await prepareArgs(buildTestArgs([tmpDir]))

    expect(prepared).toMatchObject({
      options: {},
      params: [],
      targetPath: tmpDir
    })
  })

  it("treats single argument as command if it does not exists", async () => {
    const prepared = await prepareArgs(buildTestArgs(["build"]))

    expect(prepared).toMatchObject({
      options: {},
      params: ["build"],
      targetPath: /\/mrpo$/
    })
  })
})
