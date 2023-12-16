export function findBreakPoint<T>(
  arr: Array<T>,
  check: (value: T) => boolean,
  index = 0,
) {
  for (let i = index; i < arr.length && i >= 0; i++) {
    if (check(arr[i])) {
      return i;
    }
  }
  return -1;
}
