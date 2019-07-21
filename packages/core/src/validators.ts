import { ControlValidator } from './common'

export function size<T = {}>(min = 0, max = 0): ControlValidator<T> {
  return new ControlValidator<T>('size', val => {
    if (val === null) return null
    if (!Array.isArray(val) || min > 0 && val.length < min) return {'min': min}
    if (max > 0 && val.length > max) return {'max': min}
    return null
  })
}

export function valueType<T>(type: 'string' | 'number' | 'boolean'): ControlValidator<T> {
  return new ControlValidator<T>('valueType', val => {
    if (val === null) return null
    if (typeof val !== type) return {expected: type, found: typeof val}
    return null
  })
}
