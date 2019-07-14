import toLower from "lodash.tolower"
import toUpper from "lodash.toupper"

export default function greet() {
  console.log(toLower("HELLO"))
  console.log(toUpper("hello"))
}
