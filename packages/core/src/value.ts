import { Control } from './control'
import { ControlOpts } from './common'

export interface ValueControlOpts<T> extends ControlOpts<T> {
  default: T
}

export class ValueControl<T = {}> extends Control<T> {
  private readonly _opts: Partial<ValueControlOpts<T>>

  constructor(init: T | null, opts: Partial<ValueControlOpts<T>> = {}) {

    if (init === null && typeof opts.default !== 'undefined') init = opts.default
    super(init, opts)
    this._opts = opts
  }

  setValue(value: unknown): void {
    if (typeof value === 'undefined' || value === '' || Object.is(value, NaN)) value = null
    this._nextState({value: value as T, usage: 'dirty'})
  }

  clone(): ValueControl<T> {
    return new ValueControl(this.value, this._opts)
  }
}

export default ValueControl
