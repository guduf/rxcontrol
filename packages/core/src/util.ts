export const EMPTY_ARRAY = [] as []

export function range(start: number, end: number): number[] {
  return Array.from({length: (end - start)}, (_, k) => k + start)
}

export function randomInt(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function deleteObjKey<T extends object, P extends keyof T>(
  obj: T,
  key: string | number | symbol
): Omit<T, P> {
  if (typeof obj !== 'object' || obj === null) return obj
  const clone = {...obj}
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  delete (clone as any)[key]
  return clone
}
export function deleteArrayItem<T = {}>(
  arr: T[],
  i: number
): T[] {
  if (!Array.isArray(arr)) return arr
  return [...arr.slice(0, i), ...arr.slice(i + 1)]
}

export function reorderArray<T = {}>(arr: T[], old: number, i: number): T[] {
  const movedItem = arr.find((_, j) => j === old)
  if (!movedItem) return arr
  const remainingItems = deleteArrayItem(arr, old)
  return [...remainingItems.slice(0, i), movedItem, ...remainingItems.slice(i)]
}

export function isJsonEqual(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b)
}

export function reduceByKey<P extends string, T extends { [key in P]: string }>(
  items: T[],
  key: P
): { [key: string]: T } {
  return items.reduce((acc, item) => ({...acc, [item[key]]: item}), {})
}
