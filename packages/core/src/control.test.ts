/* eslint-disable */
import { Subject, Subscription } from 'rxjs'
import { fakeSchedulers } from 'rxjs-marbles/jest'

import { syncVld, asyncVld, syncVldErr, asyncVldErr, syncVldFn, asyncVldFn } from './test/util'
import { TestObserver } from './test/util';
import { ControlErrors } from './common';
import { TestControl } from './test/control';

describe('new Control()', () => {
  beforeEach(() => jest.useFakeTimers())

  const initValueTest = '🔢'

  it('should not emit event if not no changes before complete', () => {
    const testObsvr = new TestObserver()
    const control = new TestControl(initValueTest)
    control.changes.subscribe(testObsvr)
    control.complete()
    expect(testObsvr.completed).toEqual([])
  })

  it('should complete after async validator', fakeSchedulers((advance) => {
    const testObsvr = new TestObserver()
    const control = new TestControl(initValueTest, {}, asyncVld)
    control.changes.subscribe(testObsvr)
    control.complete()
    advance(1)
    expect((testObsvr.completed || []).length).toBe(1)
  }))

  it('should set state with init value', () => {
    const control = new TestControl(initValueTest)
    const _stateEmitter = (control as unknown as { _stateEmitter: Subject<any> })._stateEmitter
    expect(_stateEmitter).toBeInstanceOf(Subject)
    const expectedState = {errors: null as ControlErrors, usage: 'untouched', value: initValueTest, visibility: 'enabled'}
    expect(control.state).toEqual(expectedState)
    control.complete()
  })

  it('should set change subscription', () => {
    const control = new TestControl()
    expect(control.errors).toBeFalsy()
    expect((control as unknown as {_validationSubscr: Subscription})._validationSubscr).toBeFalsy()
    const _changesSubscr = (control as unknown as { _changesSubscr: Subscription })._changesSubscr
    expect(_changesSubscr).toBeInstanceOf(Subscription)
    expect(_changesSubscr.closed).toBeFalsy()
    control.complete()
  })

  it('should validate first time', fakeSchedulers((advance) => {
    const control = new TestControl(initValueTest, {}, syncVld, asyncVld)
    expect(control.errors).toEqual(syncVldErr)
    advance(1)
    expect(control.errors).toEqual({...syncVldErr, ...asyncVldErr})
    expect(syncVldFn).toBeCalledTimes(1)
    expect(asyncVldFn).toBeCalledTimes(1)
    control.complete()
  }))

  it('should set set required error', () => {
    const control = new TestControl(null, {nullable: true, validators: [syncVld]})
    const testObsvr = new TestObserver()
    control.changes.subscribe(testObsvr)
    expect(syncVldFn).toBeCalledTimes(1)
    expect(control.nullable).toEqual(true)
    expect(control.errors).toEqual({...syncVldErr, $required: true})
    control.setValue('🦆')
    expect(syncVldFn).toBeCalledTimes(2)
    expect(control.errors).toEqual(syncVldErr)
    control.setValue('')
    expect(syncVldFn).toBeCalledTimes(3)
    expect(control.errors).toEqual({...syncVldErr, $required: true})
    control.unsetNullable()
    expect(syncVldFn).toBeCalledTimes(4)
    expect(control.nullable).toEqual(false)
    expect(control.errors).toEqual(syncVldErr)
    control.setNullable()
    expect(syncVldFn).toBeCalledTimes(5)
    expect(control.nullable).toEqual(true)
    expect(control.errors).toEqual({...syncVldErr, $required: true})
    expect(testObsvr.events.length).toBe(4)
    control.complete()
  })
})
