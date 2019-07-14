const fs = require("fs-extra")
const path = require("path")
const precinct = require("precinct")

const DepsCollector = require("./DepsCollector")

async function extractExternalDeps(rootPath) {
  const collector = new DepsCollector()
  await collector.updateFile(rootPath)
  return collector.dependencies
}

module.exports = extractExternalDeps
