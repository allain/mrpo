import toLower from "lodash.tolower"
import toUpper from "lodash.toupper"
import flatten from "lodash.flatten"

export default function greet() {
  console.log(toLower("HELLO"))
  console.log(toUpper("hello"))
  console.log(flatten([[1], [2]]))
}
