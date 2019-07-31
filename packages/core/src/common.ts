import {
  ObservableInput,
  Observable,
  of,
  from,
  isObservable,
  merge,
  BehaviorSubject,
  defer
} from 'rxjs'
import { first, map, distinctUntilChanged, catchError, tap } from 'rxjs/operators'

import { deleteObjKey, isJsonEqual } from './util'
import Control from './control'

export type ControlErrors = { [key: string]: unknown } | null
export type ControlUsage = 'untouched' | 'pristine' | 'dirty'
export type ControlVisibility = 'enabled' | 'locked' | 'disabled'

export interface ControlState<T = {}> {
  readonly value: T
  readonly errors: ControlErrors
  readonly usage: ControlUsage
  readonly visibility: ControlVisibility
}

export class ControlValidator<T = {}, R = {}> {
  constructor(
    readonly key: string,
    private readonly _fun: (ctrl: Control<T>) => R | null | ObservableInput<R | null>
  ) { }

  run(ctrl: Control<T>): Observable<R | null> {
    let errors = this._fun(ctrl) as Observable<R | null>
    if (errors instanceof Promise) errors = from(errors)
    else if (!isObservable(errors)) errors = of(errors as unknown as R | null)
    return errors.pipe(first())
  }
}

export function reduceValidators<T = {}>(
  validators: ControlValidator<T>[],
  prevErrors: ControlErrors = null
): { validators: ControlValidator<T>[], prevErrors: ControlErrors } {
  const reduced = validators.reduce(
    (acc, vld, i) => {
      if (!(vld instanceof ControlValidator)) {
        console.warn(`[${i}] is not a instance of ControlValidator.`)
        return acc
      }
      return {
        validators: (
          acc.validators.find(({key}) => key === vld.key) ?
            acc.validators :
            [...acc.validators, vld]
        ),
        prevErrors: (
          prevErrors && typeof prevErrors[vld.key] !== 'undefined' && prevErrors[vld.key] != null ?
            {...(acc.prevErrors || {}), [vld.key]: prevErrors[vld.key]} :
            acc.prevErrors
        )
      }
    },
    {validators: [] as ControlValidator<T>[], prevErrors: null as ControlErrors}
  )
  if (validators.length !== reduced.validators.length) {
    const dupKeys = validators.reduce<string[]>(
      (acc, vld) => (
        reduced.validators.includes(vld) || acc.includes(vld.key) ? acc : [...acc, vld.key]
      ),
      []
    )
    console.warn(
      `Validators have same key : [${dupKeys.map(key => `'${key}'`).join(', ')}].\n` +
      `Only the first validator with a duplicated key will be executed.`
    )
  }
  return reduced
}

export function validate<T = {}>(
  control: Control<T>,
  validators: ControlValidator<T>[],
  prevErrors: ControlErrors = null
): Observable<ControlErrors> {
  if (!validators.length) return of(null)
  const reduced = reduceValidators(validators, prevErrors)
  return defer(() => {
    const sub = new BehaviorSubject(reduced.prevErrors)
    const subscr = merge(...reduced.validators.map(vld => vld.run(control).pipe(
      catchError(catched => {
        console.error(`Uncaught rejection in validator with key '${vld.key}'`, catched)
        return '$unexpected'
      }),
      map((errors = null) => (
        errors !== null ? {...(sub.value || {}), [vld.key]: errors } :
          sub.value && sub.value[vld.key] ? deleteObjKey(sub.value, vld.key) :
            sub.value
      )),
    ))).subscribe(sub)
    return merge(of(sub.value), sub).pipe(
      distinctUntilChanged((x, y) => isJsonEqual(x, y)),
      tap(null, null, () => subscr.unsubscribe())
    )
  })
}

export interface ControlOpts<T = {}> {
  label: string | null
  visibility: ControlVisibility
  validators: ControlValidator<T>[]
  nullable: boolean
}

export type ControlShortOpts<T = {}, O extends ControlOpts<T> = ControlOpts<T>> = (
  true | ControlVisibility | ControlValidator<T> | Partial<O>
)

export function mergeOpts<T, O extends ControlOpts<T> = ControlOpts<T>>(
  arg: ControlShortOpts<T, O>,
  extraValidators: ControlValidator<T>[]
): Partial<O> {
  const opts = (
    arg === true ? {nullable: true} :
      typeof arg === 'string' ? {visibility: arg} :
        arg instanceof ControlValidator ? {validators: [arg]} :
          arg as Partial<ControlOpts<T>>
  ) as Partial<O>
  return {...opts, validators: [...(opts.validators || []), ...extraValidators]}
}

