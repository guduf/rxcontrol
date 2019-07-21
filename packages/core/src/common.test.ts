import { fakeSchedulers } from 'rxjs-marbles/jest'

import { TestObserver } from './test/util'
import { syncVldErr, syncVld, asyncVldErr, asyncVld, syncVldFn, asyncVldFn } from './test/util'
import { validate, ControlErrors } from './common'

/* eslint-disable */

describe('validate()', () => {
  beforeEach(() => jest.useFakeTimers())

  const initValueTest = '🔢'

  it ('should emit null synchronously without validator', () => {
    const testObsvr = new TestObserver<ControlErrors>()
    const subscr = validate(initValueTest, []).subscribe(testObsvr)
    expect(testObsvr.failed).toBeFalsy()
    expect(testObsvr.completed).toEqual([null])
    subscr.unsubscribe()
  })

  it ('should emit error synchronously with sync validator', () => {
    const testObsvr = new TestObserver<ControlErrors>()
    const subscr = validate(initValueTest, [syncVld]).subscribe(testObsvr)
    expect(testObsvr.completed).toEqual([syncVldErr])
    expect(syncVldFn).toBeCalledTimes(1)
    subscr.unsubscribe()
  })

  it('should emit error synchronously then asynchronously with both validators', fakeSchedulers((advance) => {
    const testObsvr = new TestObserver<ControlErrors>()
    const subscr = validate(initValueTest, [syncVld, asyncVld]).subscribe(testObsvr)
    expect(testObsvr.events).toEqual([syncVldErr])
    expect(testObsvr.completed).toBeFalsy()
    advance(1)
    expect(testObsvr.failed).toBeFalsy()
    expect(testObsvr.completed).toEqual([syncVldErr, {...syncVldErr, ...asyncVldErr}])
    expect(asyncVldFn).toBeCalledTimes(1)
    expect(syncVldFn).toBeCalledTimes(1)
    subscr.unsubscribe()
  }))

  it('should use prev error until validator emits', fakeSchedulers((advance) => {
    const testObsvr = new TestObserver<ControlErrors>()
    const prevErrors = {async: '🏓', test: 'from an old validator'}
    const subscr = validate(initValueTest, [syncVld, asyncVld], prevErrors).subscribe(testObsvr)
    advance(1)
    expect(testObsvr.completed).toEqual([
      {...syncVldErr, async: '🏓'},
      {...syncVldErr, ...asyncVldErr}
    ])
    expect(asyncVldFn).toBeCalledTimes(1)
    expect(syncVldFn).toBeCalledTimes(1)
    subscr.unsubscribe()
  }))
})
