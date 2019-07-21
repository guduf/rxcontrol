/* eslint-disable */
import { Subject, Subscription } from 'rxjs'
import { fakeSchedulers } from 'rxjs-marbles/jest'

import { Control } from './control'
import { syncVld, asyncVld, syncVldErr, asyncVldErr, syncVldFn, asyncVldFn } from './test/util'
import { TestObserver } from './test/util';
import { ControlErrors } from './common';

export class ControlTestImpl<T> extends Control<T> {
  setValue(value: T): void { this._nextState({value: value, usage: 'dirty'}) }


  clone(): ControlTestImpl<T> {
    throw new Error('Not implemented')
  }
}

describe('new Control()', () => {
  beforeEach(() => jest.useFakeTimers())

  const initValueTest = '🔢'

  it('should not throw error with valid args', () => {
    [initValueTest, null, 'foo', {}].forEach(val =>
      expect(() => new ControlTestImpl(val).complete()).not.toThrowError()
    )
  })

  it('should not emit event if not no changes before complete', () => {
    const testObsvr = new TestObserver()
    const control = new ControlTestImpl(initValueTest)
    control.changes.subscribe(testObsvr)
    control.complete()
    expect(testObsvr.completed).toEqual([])
  })

  it('should complete after async validator', fakeSchedulers((advance) => {
    const testObsvr = new TestObserver()
    const control = new ControlTestImpl(initValueTest, {}, asyncVld)
    control.changes.subscribe(testObsvr)
    control.complete()
    advance(1)
    expect((testObsvr.completed || []).length).toBe(1)
  }))

  it('should set state with init value', () => {
    const control = new ControlTestImpl(initValueTest)
    const _stateEmitter = (control as unknown as { _stateEmitter: Subject<any> })._stateEmitter
    expect(_stateEmitter).toBeInstanceOf(Subject)
    const expectedState = {errors: null as ControlErrors, usage: 'untouched', value: initValueTest, visibility: 'enabled'}
    expect(control.state).toEqual(expectedState)
    control.complete()
  })

  it('should set change subscription', () => {
    const control = new ControlTestImpl(initValueTest)
    expect(control.errors).toBeFalsy()
    expect((control as unknown as {_validationSubscr: Subscription})._validationSubscr).toBeFalsy()
    const _changesSubscr = (control as unknown as { _changesSubscr: Subscription })._changesSubscr
    expect(_changesSubscr).toBeInstanceOf(Subscription)
    expect(_changesSubscr.closed).toBeFalsy()
    control.complete()
  })

  it('should validate first time', fakeSchedulers((advance) => {
    const control = new ControlTestImpl(initValueTest, {}, syncVld, asyncVld)
    expect(control.errors).toEqual(syncVldErr)
    advance(1)
    expect(control.errors).toEqual({...syncVldErr, ...asyncVldErr})
    expect(syncVldFn).toBeCalledTimes(1)
    expect(asyncVldFn).toBeCalledTimes(1)
    control.complete()
  }))
})
