import { reorderArray } from './util'

import Control from './control'
import { ControlOpts} from './common'
import ControlWithChildren, { ChildrenValue, ControlArray } from './controlWithChildren'

/* eslint-disable-next-line max-len */
export class ArrayControl<
  A extends ControlArray = ControlArray,
  T extends ChildrenValue<A> = ChildrenValue<A>
> extends ControlWithChildren<A, T> {
  get items(): A { return this._children.value }

  private readonly _opts: Partial<ControlOpts<T>>

  constructor(controls: A, opts: Partial<ControlOpts<T>> = {}) {
    const init = controls.map((control, i) => {
      if (!(control instanceof Control)) throw (
        new TypeError(`[${i}] must be instance of Control`)
      )
      return control.value
    }) as T
    super(controls, init, opts)
    this._opts = opts
  }

  clone(): ArrayControl<A, T> {
    return new ArrayControl<A, T>(
      this.items.map(c => c.clone()) as A,
      this._opts
    )
  }

  push(control: A[number]): void {
    if (!(control instanceof Control)) throw (
      new TypeError(`control must be instance of Control`)
    )
    const nextChildren = [...this.items, control] as A
    this._nextChildren(nextChildren.map(ctrl => ctrl.value) as T, nextChildren)
  }

  remove(arg: number | A[number]): void {
    const i = typeof arg === 'number' ? arg : this.items.indexOf(arg)
    const nextChildren = [...this.items.slice(0, i), ...this.items.slice(i + 1)] as A
    this._nextChildren(nextChildren.map(ctrl => ctrl.value) as T, nextChildren)
  }

  reorder(old: number, i: number): void {
    const nextChildren = reorderArray(this.items, old, i) as A
    this._nextChildren(nextChildren.map(ctrl => ctrl.value) as T, nextChildren)
  }

  protected _getValueOnChildChange(i: number, value: T[number]): T {
    return [...(this.value || []).slice(0, i), value, ...(this.value || []).slice(i + 1)] as T
  }
}

export default ArrayControl
