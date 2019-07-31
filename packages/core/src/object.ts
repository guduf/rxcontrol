
import { ControlOpts } from './common'

import Control from './control'
import ControlWithChildren, { ControlObject, ChildrenValue } from './controlWithChildren'

export class ObjectControl<
  CO extends ControlObject = ControlObject,
  T extends ChildrenValue<CO> = ChildrenValue<CO>
> extends ControlWithChildren<CO, T> {
  get fields(): CO { return this._children.value }

  private readonly _opts: Partial<ControlOpts<T>>

  constructor(controls: CO, opts: Partial<ControlOpts<T>> = {}) {
    const init = Object.keys(controls).reduce<{ [P in keyof T]: T[P] | null }>(
      (acc, key) => {
        const control = controls[key as keyof CO]
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

  clone(): ObjectControl<CO, T> {
    return new ObjectControl(
      Object.keys(this.fields).reduce((acc, key) => ({
        ...acc,
        [key]: this.getChild(key as keyof T).clone()
      }), {} as CO),
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
