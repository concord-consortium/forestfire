export const deepEqual = (object1: any, object2: any) =>{
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    let val1 = object1[key];
    let val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (typeof val1 === "number" && typeof val2 === "number") {
      val1 = parseFloat(val1.toFixed(3));
      val2 = parseFloat(val2.toFixed(3));
      console.log("val1", val1, "val2", val2);
    }
    if (
      areObjects && !deepEqual(val1, val2) ||
      !areObjects && val1 !== val2
    ) {
      return false;
    }
  }

  return true;
}

const isObject = (object: any) => {
  return object != null && typeof object === "object";
}
