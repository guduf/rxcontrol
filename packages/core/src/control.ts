import { Observable, Subscription, Subject, of } from 'rxjs'
import { map, pairwise, startWith, share, mergeMap } from 'rxjs/operators'

import {
  ControlOpts,
  ControlErrors,
  ControlState,
  ControlUsage,
  ControlValidator,
  ControlVisibility,
  validate
} from './common'
import { isJsonEqual } from './util'

export function isStateEqual(prev: ControlState, curr: ControlState): boolean {
  if (prev === curr) return true
  if (prev.usage !== curr.usage) return false
  if (prev.visibility !== curr.visibility) return false
  if (!isJsonEqual(prev.value, curr.value)) return false
  if (!isJsonEqual(prev.errors, curr.errors)) return false
  return true
}

export abstract class Control<T = {}> implements ControlState<T> {
  readonly changes: Observable<ControlState<T>>
  readonly eventHandler = (event: { target: { value: unknown } }): void => (
    this.setValue(event.target.value)
  )

  private _nullable: boolean

  get closed(): boolean { return this._stateEmitter.closed }
  get dirty(): boolean { return this.usage === 'dirty' }
  get disabled(): boolean { return this.visibility === 'disabled' }
  get enabled(): boolean { return this.visibility === 'enabled' }
  get errors(): ControlErrors { return this._state.errors }
  get locked(): boolean { return ['locked', 'disabled'].includes(this.usage) }
  get null(): boolean { return Object.is(this.value, null) }
  get nullable(): boolean { return this._nullable }
  get pristine(): boolean { return ['pristine', 'untouched'].includes(this.usage) }
  get state(): ControlState<T> { return {...this._state} }
  get untouched(): boolean { return this.usage === 'untouched' }
  get usage(): ControlUsage { return this._state.usage }
  get value(): T { return this._state.value as T }
  get valid(): boolean { return !this.errors }
  get invalid(): boolean { return !this.valid }
  get visibility(): ControlVisibility { return this._state.visibility }

  private readonly _changesSubscr: Subscription
  private readonly _stateEmitter: Subject<ControlState<T>>
  protected _validators: ControlValidator<T>[]

  private _state: ControlState<T>
  private _forceNextValidation: boolean
  private _validationSubscr: Subscription | null

  constructor(
    init: T | null,
    opts: Partial<ControlOpts<T>> = {},
    ...validators: ControlValidator<T>[]
  ) {
    const requiredVld = new ControlValidator<T>('$required', ctrl => {
      const res = ctrl.nullable ? null : ((ctrl.value === null || ctrl.value === '' as unknown) || null)
      return res
    })
    this._nullable = typeof opts.nullable === 'boolean' ? opts.nullable : false
    this._validators = [requiredVld, ...(opts.validators || []), ...validators]
    this._stateEmitter = new Subject<ControlState<T>>()

    this.changes = this._stateEmitter.pipe(
      startWith(null as unknown as ControlState<T>),
      pairwise(),
      mergeMap(([prev, curr]) => {
        this._state = curr
        if (this._forceNextValidation ||  !prev || !isJsonEqual(curr.value, prev.value)) {
          this._forceNextValidation = false
          return this._validate().pipe(map(errors => (this._state = {...this._state, errors})))
        }
        return of(this._state)
      }),
      share()
    )
    this._changesSubscr = this.changes.subscribe()
    this._stateEmitter.next({
      value: init as T,
      visibility: opts.visibility || 'enabled',
      usage: 'untouched',
      errors: null
    })
  }

  abstract clone(): Control<T>

  abstract setValue(value: unknown, opts?: { keepPristine?: boolean }): void

  forceValidation(): void {
    this._forceNextValidation = true
    this._stateEmitter.next(this.state)
  }

  complete(): void {
    this._stateEmitter.complete()
    this._changesSubscr.unsubscribe()
    if (this._validationSubscr) this._validationSubscr.unsubscribe()
  }

  setNullable(): void {
    if (this._nullable) return
    this._nullable = true
    this.forceValidation()
  }

  unsetNullable(): void {
    if (!this._nullable) return
    this._nullable = false
    this.forceValidation()
  }

  protected _validate(): Observable<ControlErrors> {
    return validate(this, this._validators)
  }

  protected _nextState(partialState: Partial<ControlState<T>>): void {
    const nextState = {...this.state, ...partialState}
    if (isStateEqual(this.state, nextState)) return
    this._stateEmitter.next(nextState)
  }
}

export type ControlValue<C> = C extends Control<infer X> ? X : {}

export default Control
