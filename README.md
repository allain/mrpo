# Mr Po

An experiment on writing a near invisible developer toolchain.

## Pain Points

I absolutely hate having to maintain toolchains for my projects. Dependency management alone is enough to drive me to drink.
As much as possible my toolchain should get out of my way.

## Ideas

1. Take all build settings and move them out into their own build projects
2. Build projects are black boxes that make sane assumptions that can be overriden as needed.
3. By having a build project that targets monorepo building, the tool itself could be a monorepo tool that exposes actions that are useful for that kind of project.

## Basic Usage

Install mrpo globally `npm install --global mrpo`

Create a minimalistic mrpo.json file and declare what mrpo executor the project uses:

```json
{
  "name": "example1",
  "version": "1.0.0",
  "executor": "mrpo-executor-pika-js"
}
```

Run commands using mrpo. Commands are exposed by the executor:

```bash
mrpo #to display a list of available commands
mrpo build
mrpo dev
mrpo deps
```

Things to note:

1. mrpo.json does not declare dependencies or devDependencies (unless you want to pin something down). They are infered by the executor using static analysis.
2. The actual type specification can be anything, I'm using npm modules, but they could just as easily be docker images, so in principle the mrpo could be used to build go aswell.

## Monorepos

<strong>NOTE: TODO</strong>

Monorepos are just mrpo projects based on monorepo executor.

```json
{
  "name": "example-monorepo",
  "version": "1.0.0",
  "executor": "mrpo-executor-monorepo"
}
```

The monorepo executor will walk the directory structure looking for nested `mrpo.json` files and expose all of their commands.

Running `mrpo build` would do some dependency analysis on the sub projects and infer a sequence in which to run `mrpo build` recursively on them.

## Executor API

In order to have things be as flexible as possible, the executor should provide an API that's trivial

It would need to support:

1. Querying for supported commands
2. Invoking them
3. Cleanly terminating them (for things like mrpo test --watch and mrpo dev)

At the moment I've crafted up a SimpleExecutor interface that can expose this:

```js
{
  async build() { ... }
  dev: {
    async start() {}
    stop() {}
  }
}
```
