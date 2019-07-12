# Mr Po
An experiment on writing a build tool that can grow to support monorepos trivially.

Note: This project is currently only dream code. No real project exists.

## Pain Points

I absolutely hate having to mainting toolchains for my projects. Dependency management alone is enough to drive me to drink.
As much as possible my toolchain should get out of my way.

## Ideas
1. Take all build settings and move them out into their own build projects
2. Build projects are black boxes that make sane assumptions that can be overriden as needed.
3. By having a build project that targets monorepo building, the tool itself could be a monorepo tool that exposes actions that are useful for that kind of project.


## Basic Usage

Install mrpo globally `npm install --global mrpo`

Create a minimalistic mrpo.json file and declare what mrpo builder the project uses:

```json
{
  "name": "example1",
  "version": "1.0.0",
  "builder": "@mrpo/builder-typescript-pkg@^1.0.0"
}
```

Run commands using mrpo. Commands are exposed by the builder:
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
1. mrpo.json does not declare dependencies or devDependencies. The builder infers them based on static analysis of the source code, but that's up to the builder. the mrpo config depends on the builder being used.
2. The actual type specification can be anything, I'm using npm modules, but they could just as easily be docker images, so in principle the mrpo could be used to build go aswell.

## Monorepos

Monorepos are just mrpo projects based on metarepo builder templates

```json
{ 
  "name": "example-monorepo",
  "version": "1.0.0",
  "builder": "@mrpo/builder-monorepo",
}
```

The monorepo builder will walk the directory structure looking for nested `mrpo.json` files and build them.
