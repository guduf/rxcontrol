import { Control, isStateEqual } from './control'
import { ControlValidator, ControlState, ControlOpts } from './common'
import { BehaviorSubject, from, merge } from 'rxjs'
import { mergeMap, startWith, pairwise, tap, map } from 'rxjs/operators'

import { isJsonEqual } from './util'

export type ControlArray<T = {}> = Control<T>[]

export type ControlFields<T = {}> = { readonly [P in keyof T]: Control<T[P]> }

export type ChildrenValue<C extends ControlFields | ControlArray> = (
  C extends ControlFields ? { [P in keyof C]: C[P] extends Control<infer X> ? X : never } :
    C extends ControlArray<infer X> ? X[] :
      never
)

export function getChildrenErrors<T = {}>(
  children: ControlFields<T> | Control<T>[]
): string[] | null {
  const errors =  Object.keys(children).reduce(
    (acc, key) => [
      ...acc,
      ...((children as ControlFields<T>)[key as keyof T].errors ? [key] : [])
    ],
    [] as string[]
  )
  return errors.length ? errors : null
}

export abstract class ControlWithChildren<
  C extends ControlFields | Control[],
  T extends ChildrenValue<C> = ChildrenValue<C>
> extends Control<T> {
  get children(): C { return this._children.value }
  protected _children: BehaviorSubject<C>

  constructor(
    children: C,
    init: { [P in keyof T]: T[P] | null } | null,
    opts: Partial<ControlOpts<T>> = {}
  ) {
    const childrenVld = new ControlValidator<T>('$children', ctrl => (
      getChildrenErrors(
        typeof (ctrl as ControlWithChildren<C, T>)._children !== 'undefined' ?
          (ctrl as ControlWithChildren<C, T>)._children.value :
          children
        )
    ))
    super(init as T | null, opts, childrenVld)
    this._children = new BehaviorSubject(children)
    const childObs = this._children.pipe(
      map(children => (
        Array.isArray(children) ?
          children :
          Object.keys(children).map(key =>
            (children as unknown as ControlFields<T>)[key as keyof T]
          )
      ) as Control<T>[]),
      pairwise(),
      tap(([prev, curr]) => prev.forEach(child => {
        if (!curr.includes(child)) child.complete()
      }))
    )
    const childStateObs = this._children.pipe(
      mergeMap(children => from(Object.keys(children))),
      mergeMap(key => this.getChild(key as keyof T).changes.pipe(
        startWith(
          this.getChild(key as keyof T) ? this.getChild(key as keyof T).state : null
        ),
        pairwise(),
        tap(([prev, curr]) => this._onChildChange(key as keyof T, prev, curr as ControlState))
      ))
    )
    merge(childObs, childStateObs).subscribe(null, err => console.error(err))
  }

  protected abstract _getValueOnChildChange(key: keyof T, value: unknown): T

  setValue(value: T, opts: { keepPristine?: boolean } = {}): void {
    if (typeof value !== 'object' || !value) return console.error(
      'Value must be a object with index signature'
    )
    Object.keys(this._children.value).forEach(key => {
      if (typeof value[key as keyof T] === 'undefined') return console.error(
        `Must provide value for key [${key}]`
      )
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      this.getChild(key as keyof T).setValue((value as { [key: string]: any })[key] || null, opts)
    })
  }

  complete(): void {
    super.complete()
    this._children.complete()
    Object.keys(this._children.value).forEach(key => this.getChild(key as keyof T).complete())
  }

  getChild(key: keyof T): Control<T[keyof T]> {
    return (this._children.value as unknown as ControlFields<T>)[key as keyof T]
  }

  protected _nextChildren(next: T, children: C, opts: { keepPristine?: boolean } = {}): void {
    this._children.next(children)
    this._nextState({
      ...this.state,
      value: next,
      ...(this.pristine && !opts.keepPristine ? {usage: 'dirty'} : {})
    })
  }

  private _onChildChange(key: keyof T, prev: ControlState | null, curr: ControlState): void {
    if (prev && isStateEqual(prev, curr)) return
    const nextState = {
      usage: this.pristine ? curr.usage : this.usage,
      value: (
        !prev || !isJsonEqual(prev.value, curr.value) ?
          this._getValueOnChildChange(key as keyof T, curr.value) :
          this.value
      )
    }
    if (!prev || Boolean(prev.errors) !== Boolean(curr.errors)) {
      this.forceValidation()
    }
    this._nextState(nextState)
  }
}

export default ControlWithChildren
