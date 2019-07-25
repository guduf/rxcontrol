
import { ControlOpts } from './common'

import Control from './control'
import ControlWithChildren, { ControlObject, ChildrenValue } from './controlWithChildren'

export class ObjectControl<
  G extends ControlObject = ControlObject,
  T extends ChildrenValue<G> = ChildrenValue<G>
> extends ControlWithChildren<G, T> {
  get fields(): G { return this._children.value }

  private readonly _opts: Partial<ControlOpts<T>>

  constructor(controls: G, opts: Partial<ControlOpts<T>> = {}) {
    const init = Object.keys(controls).reduce<{ [P in keyof T]: T[P] | null }>(
      (acc, key) => {
        const control = controls[key as keyof G]
        if (!(control instanceof Control)) throw (
          new TypeError(`[${key}] must be instance of Control`)
        )
        return {...acc, [key]: control.value}
      },
      {} as { [P in keyof T]: T[P] }
    ) as T
    super(controls, init, opts)
    this._opts = opts
  }

  clone(): ObjectControl<G, T> {
    return new ObjectControl(
      Object.keys(this.fields).reduce((acc, key) => ({
        ...acc,
        [key]: this.getChild(key as keyof T).clone()
      }), {} as G),
      this._opts
    )
  }

  patchValue(value: Partial<T>): void {
    Object.keys(value).forEach(key => {
      const child = this.getChild(key as keyof T)
      if (!child) return console.warn(`Missing child control for key [${key}]`)
      child.setValue(value[key as keyof T])
    })
  }

  protected _getValueOnChildChange(key: keyof T, value: T[keyof T]): T {
    return {...this.value, [key]: value}
  }
}

export default ObjectControl
