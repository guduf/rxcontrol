/* eslint-disable */
import { fakeSchedulers } from 'rxjs-marbles/jest'

import { TestObserver } from './test/util'

import ControlWithChildren, { ControlObject } from './controlWithChildren'
import { syncVld, syncVldFn, groupVld, groupVldErr, groupVldFn, asyncVld, asyncVldFn } from './test/util'
import { ControlValidator, ControlShortOpts, mergeOpts } from './common'
import { TestControl } from './test/control'

beforeEach(() => jest.useFakeTimers())

export class ControlWithChildrenTestImpl<T extends object> extends ControlWithChildren<ControlObject, T> {
  children: ControlObject<T>

  constructor(
    children: ControlObject<T>,
    opts: ControlShortOpts<T> = {},
    ...validators: ControlValidator<T>[]
  ) {
    const init = Object.keys(children).reduce<{ [P in keyof T]: T[P] | null }>(
      (acc, key) => ({...acc, [key]: children[key as keyof T].value}),
      {} as unknown as { [P in keyof T]: T[P] }
    ) as T
    super(children, init, mergeOpts(opts, validators))

  }

  clone(): ControlWithChildrenTestImpl<T> {
    throw new Error('Not implemented')
  }

  nextChildren(children: ControlObject<T>): void {
    const next = Object.keys(children).reduce<{ [P in keyof T]: T[P] | null }>(
      (acc, key) => ({...acc, [key]: children[key as keyof T].value}),
      {} as unknown as { [P in keyof T]: T[P] }
    ) as T
    this._nextChildren(next, children)
  }

  protected _getValueOnChildChange(key: keyof T, value: T[keyof T]): T {
    return {...this.value, [key]: value}
  }
}

describe('ControlWithChildren', () => {
  it('should create a group of controls and init the value', () => {
    const animal = '🐘'
    const fruit = '🍐'
    const testObsvr = new TestObserver()
    const group = new ControlWithChildrenTestImpl({
      animal: new TestControl(animal),
      fruit: new TestControl(fruit, {validators: [syncVld]})
    })
    group.changes.subscribe(testObsvr)
    expect(group.state).toEqual({
      usage: 'untouched',
      visibility: 'enabled',
      value: {animal, fruit},
      errors: {$children: ['fruit']}
    })
    expect(syncVldFn).toHaveBeenCalledTimes(1)
    group.complete()
    expect(testObsvr.completed).toEqual([])
  })

  it('should set value and validate when a children change', () => {
    const fruit = '🍐'
    const testObsvr = new TestObserver()
    const group = new ControlWithChildrenTestImpl<{ fruit: string }>({
      fruit: new TestControl(fruit)
    }, groupVld)
    expect(groupVldFn).toHaveBeenCalledTimes(1)
    group.changes.subscribe(testObsvr)
    group.children['fruit'].setValue('🍌')
    expect(groupVldFn).toHaveBeenCalledTimes(2)
    group.complete()
    expect(testObsvr.completed).toEqual([{
      usage: 'dirty',
      visibility: 'enabled',
      value: {fruit: '🍌'},
      errors: groupVldErr
    }])
  })
  it('should emit event when child async validator changes', fakeSchedulers(advance => {
    const fruit = '🍐'
    const testObsvr = new TestObserver()
    const group = new ControlWithChildrenTestImpl<{ fruit: string }>({
      fruit: new TestControl(fruit, {validators: [asyncVld]})
    })
    expect(group.state).toEqual({
      usage: 'untouched',
      visibility: 'enabled',
      value: {fruit},
      errors: null
    })
    group.changes.subscribe(testObsvr)
    advance(1)
    group.complete()
    expect(asyncVldFn).toHaveBeenCalledTimes(1)
    expect(testObsvr.completed).toEqual([{
      usage: 'untouched',
      visibility: 'enabled',
      value: {fruit},
      errors: {$children: ['fruit']}
    }])
  }))

  it('should revalidate when children changes', fakeSchedulers(() => {
    const animal = '🐷'
    const fruit = '🍐'
    const vldErrors = [null, '🐒']
    const vldFn = jest.fn(() => vldErrors.splice(0, 1)[0])
    const vld = new ControlValidator('monkey', vldFn)
    const testObsvr = new TestObserver()
    const group = new ControlWithChildrenTestImpl<any>(
      {fruit: new TestControl(fruit, {validators: [asyncVld]})},
      vld
    )
    group.changes.subscribe(testObsvr)
    expect(vldFn).toBeCalledTimes(1)
    group.nextChildren({animal: new TestControl(animal)})
    expect(vldFn).toBeCalledTimes(2)
    group.complete()
    expect(testObsvr.events).toEqual([
      {
        usage: 'dirty',
        visibility: 'enabled',
        value: {animal},
        errors: {monkey: '🐒'}
      }
    ])
  }))
})
