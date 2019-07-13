import greet from "./included.js"

class A {
  async test() {
    console.log("HERE")
  }
}

const a = new A()
a.test()

greet()
