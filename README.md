# Mr Po

An experiment on writing a build tool that can grow to support monorepos trivially.

** WIP ** - if you want to actually try it do this:

```bash
npm run setup
cd examples/javascript-pkg
mrpo build
```

## Pain Points

I absolutely hate having to mainting toolchains for my projects. Dependency management alone is enough to drive me to drink.
As much as possible my toolchain should get out of my way.

## Ideas

1. Take all build settings and move them out into their own build projects
2. Build projects are black boxes that make sane assumptions that can be overriden as needed.
3. By having a build project that targets monorepo building, the tool itself could be a monorepo tool that exposes actions that are useful for that kind of project.

## Basic Usage

Install mrpo globally `npm install --global mrpo`

Create a minimalistic mrpo.json file and declare what mrpo bundler the project uses:

```json
{
  "name": "example1",
  "version": "1.0.0",
  "bundler": "@mrpo/typescript-pkg-bundler@^1.0.0"
}
```

Run commands using mrpo. Commands are exposed by the bundler:

```bash
# display available commands
mrpo
mrpo build
mrpo clean
mrpo publish
mrpo run
mrpo dev
mrpo test
mrpo test --watch
```

Things to note:

1. mrpo.json does not declare dependencies or devDependencies. The bundler infers them based on static analysis of the source code, but that's up to the bundler. the mrpo config depends on the bundler being used.
2. The actual type specification can be anything, I'm using npm modules, but they could just as easily be docker images, so in principle the mrpo could be used to build go aswell.

## Monorepos

Monorepos are just mrpo projects based on metarepo bundler templates

```json
{
  "name": "example-monorepo",
  "version": "1.0.0",
  "bundler": "@mrpo/bundler-monorepo"
}
```

The monorepo bundler will walk the directory structure looking for nested `mrpo.json` files and expose all of their commands.

Running `mrpo build` would do some dependency analysis on the sub projects and infer a sequence in which to run "mrpo build recursively on them".

## Bundler API

In order to have things be as flexible as possible, the bundlers should provide an API that's trivial

It would need to support:

1. Querying for supported commands
2. Invoking them
3. Cleanly terminating them (for things like mrpo test --watch and mrpo dev)

In the JavaScript world we could just export an object:

```js
{
  listCommands():String[],
  exec(commandName, args) : Promise,
  stop(commandName)
}
```

For things like exposing dockerfile builds we could just call out to a shell command that conforms to the same API.

```bash
./bundler # outputs command names on separate lines
./bundler command #runs the command and stays running till done or terminated by sending a nice SIGINT
```
