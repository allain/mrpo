const path = require("path")
const fs = require("fs-extra")
const precinct = require("precinct")

/**
 *
 * @param {Set} a
 * @param {Set} b
 */
function sameSet(a, b) {
  if (a.size !== b.size) return false
  for (const inA of a) {
    if (!b.has(inA)) return false
  }
  return true
}

class DepsCollector {
  constructor() {
    this.externals = new Set()
    this.depsMap = {}
    this.fileDeps = {}
  }

  async updateFile(srcFile) {
    const srcFiles = [srcFile]

    let changed = false

    while (srcFiles.length) {
      const srcFile = srcFiles.pop()

      const fileDeps = precinct(await fs.readFile(srcFile, "utf-8")).reduce(
        (newDeps, dep) => {
          if (dep.match(/^[./]/)) {
            // dep is to a path
            const depPath = require.resolve(dep, {
              paths: [path.dirname(srcFile)]
            })
            newDeps.internal.add(depPath)
          } else {
            if (dep[0] === "@") {
              // scoped dep
              const [scope, name] = dep.split("/", 3)
              dep = `${scope}/${name}`
            } else {
              const [name] = dep.split("/", 2)
              dep = name
            }
            newDeps.external.add(dep)
            // dep is to something external
          }
          return newDeps
        },
        { external: new Set(), internal: new Set() }
      )

      const oldDeps = this.fileDeps[srcFile]
      this.fileDeps[srcFile] = fileDeps

      if (oldDeps) {
        if (
          !sameSet(oldDeps.internal, fileDeps.internal) ||
          !sameSet(oldDeps.external, fileDeps.external)
        ) {
          changed = true
        }
      } else {
        for (const internal of fileDeps.internal) {
          srcFiles.push(internal)
        }
      }
    }

    return changed
  }

  get dependencies() {
    const externals = new Set()
    for (const { external } of Object.values(this.fileDeps)) {
      for (const dep of external) {
        externals.add(dep)
      }
    }

    return [...externals].sort()
  }
}

module.exports = DepsCollector
