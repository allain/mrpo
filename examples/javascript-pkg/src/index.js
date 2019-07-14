import greet from "./included.js"

class A {
  async test() {
    console.log("HERE Again")
  }
}

const a = new A()
a.test()

greet()
