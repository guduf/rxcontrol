import { TestObserver } from './test/util'

import { ValueControl } from './value'
import { syncVld, syncVldErr, syncVldFn } from './test/util'

describe('Control', () => {
  it('should set set required error', () => {
    const control = new ValueControl(null, {nullable: true, validators: [syncVld]})
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
