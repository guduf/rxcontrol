import { ControlValidator } from './common'

export function size<T = {}>(min = 0, max = 0): ControlValidator<T> {
  return new ControlValidator<T>('size', ctrl => {
    if (ctrl.value === null) return null
    if (!Array.isArray(ctrl.value) || min > 0 && ctrl.value.length < min) return {'min': min}
    if (max > 0 && ctrl.value.length > max) return {'max': min}
    return null
  })
}

export function valueType<T>(type: 'string' | 'number' | 'boolean'): ControlValidator<T> {
  return new ControlValidator<T>('valueType', ctrl => {
    if (ctrl.value === null) return null
    if (typeof ctrl.value !== type) return {expected: type, found: typeof ctrl.value}
    return null
  })
}
