#!/usr/bin/env node
const fs = require("fs-extra")
const path = require("path")
const debug = require("debug")("mrpo")

const MrPo = require("../src/MrPo")

module.exports.prepareArgs = prepareArgs

async function prepareArgs(argv) {
  const rawOptions = require("minimist")(argv)
  const { _, ...options } = rawOptions
  const params = rawOptions._.slice(2)
  if (params.length === 0) {
    return { targetPath: process.cwd(), options: {}, params: [] }
  }

  const candidateTarget = path.resolve(process.cwd(), params[params.length - 1])

  if (
    (await fs.pathExists(candidateTarget)) &&
    (await fs.stat(candidateTarget)).isDirectory
  ) {
    return {
      targetPath: candidateTarget,
      options,
      params: params.slice(0, params.length - 1)
    }
  } else {
    return { targetPath: path.resolve(process.cwd(), "."), options, params }
  }
}

async function main(argv = process.argv) {
  const preparedArgs = await prepareArgs(argv)

  debug("target path %s", preparedArgs.targetPath)

  const mrpo = await MrPo.build(preparedArgs.targetPath)

  if (preparedArgs.params.length === 0) {
    // output available commands
    const commands = await mrpo.listCommands()
    console.log(commands.join("\n"))
    return
  }

  const [commandName, ...params] = preparedArgs.params

  let running = true
  const execution = mrpo.exec(commandName, preparedArgs.options)

  function stop(args) {
    if (running) {
      running = false
      execution.cancel()
    }
  }

  execution.finally(() => {
    running = false
    process.off("SIGINT", stop)
  })

  process.on("SIGINT", stop)

  return execution
}

if (require.main === module) {
  main().catch(err => {
    console.error(err)
  })
}
