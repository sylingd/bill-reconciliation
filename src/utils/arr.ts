export function findBreakPoint<T>(
  arr: Array<T>,
  check: (value: T) => boolean,
  index = 0,
  step = 1,
) {
  for (let i = index; i < arr.length && i >= 0; i += step) {
    if (check(arr[i])) {
      return i;
    }
  }
  return step > 0 ? arr.length : 0;
}
