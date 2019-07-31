import { Control } from './control'
import { ControlOpts, ControlValidator } from './common'
import { valueType } from 'src';

export interface ValueControlOpts<T> extends ControlOpts<T> {
  default: T
}

export class ValueControl<T = {}> extends Control<T> {
  protected readonly _opts: Partial<ValueControlOpts<T>>

  constructor(
    init: T | null,
    opts: Partial<ValueControlOpts<T>> = {},
    ...builtinValidators: ControlValidator<T>[]
  ) {
    if (init === null && typeof opts.default !== 'undefined') init = opts.default
    super(init, opts, ...builtinValidators)
    this._opts = opts
  }

  setValue(value: unknown, opts: { keepPristine? : boolean } = {}): void {
    if (typeof value === 'undefined' || value === '' || Object.is(value, NaN)) value = null
    this._nextState({
      value: value as T,
      ...(this.pristine && !opts.keepPristine ? {usage: 'dirty'} : {})
    })
  }

  clone(): ValueControl<T> {
    return new ValueControl(this.value, this._opts)
  }
}

export interface StringControlOpts<T extends string | (string | null) = string> extends ValueControlOpts<T> {
  multiline: boolean
}

export class StringControl<T extends string | (string | null) = string> extends ValueControl<T> {
  readonly multiline: boolean

  constructor(init: T | null, opts: Partial<StringControlOpts<T>> = {}) {
    if (init === null && typeof opts.default !== 'undefined') init = opts.default
    super(init, opts, valueType('string'))
    this.multiline = opts.multiline === true
  }

  clone() {
    return new StringControl(this.value, {...this._opts, multiline: this.multiline})
  }
}

export default ValueControl
