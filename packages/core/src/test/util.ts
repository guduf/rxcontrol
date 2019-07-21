/* eslint-disable */

import { of, Observer } from 'rxjs'
import { delay } from 'rxjs/operators'
import { ControlValidator } from '../common'

export class TestObserver<T = {}> implements Observer<T> {
  private _events = [] as T[]
  private _errors = [] as any[]
  private _completed = false

  get completed(): false | T[] { return (this._completed && !this.failed) && this._events }
  get events(): T[] { return this._events }
  get lastEvent(): T | undefined { return this._events[this.length - 1] }
  get errors(): any[] { return this._errors }
  get failed(): boolean { return Boolean(this._errors.length) }
  get length(): number { return this._events.length }
  get empty(): boolean { return this._completed && !this.length }

  readonly next = (e: T): void => { this._events.push(e) }

  readonly error = (err: any): void => { this._errors.push(err) }

  readonly complete = (): void => { this._completed = true; }
}

export const asyncVldErr = {async: '🐢'}
export const asyncVldFn = jest.fn(() => of(asyncVldErr.async).pipe(delay(1)))
export const asyncVld = new ControlValidator<string>('async', asyncVldFn)
export const syncVldErr = {sync: '🐇'}
export const syncVldFn = jest.fn(() => syncVldErr.sync)
export const syncVld = new ControlValidator<string>('sync', syncVldFn)
export const groupVldErr = {group: '📖'}
export const groupVldFn = jest.fn(() => groupVldErr.group)
export const groupVld = new ControlValidator<object>('group', groupVldFn)

beforeEach(() => {
  asyncVldFn.mockClear()
  syncVldFn.mockClear()
})
