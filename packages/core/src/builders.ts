import { ArrayInitiator, ObjectInitiator, ValueBuilder } from './builder'
import { ValueControlOpts } from './value'
import { ControlValidator, ControlVisibility, ControlOpts } from './common'
import { valueType } from './validators'

export interface ValueBuilderFn {
  /* eslint-disable-next-line max-len */
  <T>(opts: Partial<ValueControlOpts<T | null>> & { nullable: true }, ...validators: ControlValidator<T | null>[]): ValueBuilder<T | null>
  <T>(opts: true, ...validators: ControlValidator<T | null>[]): ValueBuilder<T | null>
  <T>(...validators: ControlValidator<T>[]): ValueBuilder<T>
  /* eslint-disable-next-line max-len */
  <T>(opts: Partial<ValueControlOpts<T>>  & { nullable?: false }, ...validators: ControlValidator<T>[]): ValueBuilder<T>
  <T>(visibility: ControlVisibility): ValueBuilder<T>
}

export const value: ValueBuilderFn = ValueBuilder

export interface ArrayInitiatorFn {
  /* eslint-disable-next-line max-len */
  <T>(opts: Partial<ControlOpts<T | null>> & { nullable: true }, ...validators: ControlValidator<T | null>[]): ArrayInitiator<T | null>
  <T>(opts: true, ...validators: ControlValidator<T | null>[]): ArrayInitiator<T | null>
  <T>(...validators: ControlValidator<T>[]): ArrayInitiator<T>
  /* eslint-disable-next-line max-len */
  <T>(opts: Partial<ControlOpts<T>>  & { nullable?: false }, ...validators: ControlValidator<T>[]): ArrayInitiator<T>
  <T>(visibility: ControlVisibility): ArrayInitiator<T>
}

export const array: ArrayInitiatorFn = ArrayInitiator

export interface ObjectInitiatorFn {
  /* eslint-disable-next-line max-len */
  <T>(opts: Partial<ControlOpts<T | null>> & { nullable: true }, ...validators: ControlValidator<T | null>[]): ObjectInitiator<T | null>
  <T>(opts: true, ...validators: ControlValidator<T | null>[]): ObjectInitiator<T | null>
  <T>(...validators: ControlValidator<T>[]): ObjectInitiator<T>
  /* eslint-disable-next-line max-len */
  <T>(opts: Partial<ControlOpts<T>>  & { nullable?: false }, ...validators: ControlValidator<T>[]): ObjectInitiator<T>
  <T>(visibility: ControlVisibility): ObjectInitiator<T>
}

export const object: ObjectInitiatorFn = ObjectInitiator

export function injectBuiltinValidators<F extends Function>(
  builderFn: F,
  ...vlds: ControlValidator<any>[]
): F {
  return ((...args: any[]) => builderFn(...args, ...vlds)) as unknown as F
}

export interface BuiltinValueBuilderFn<T> {
  /* eslint-disable-next-line max-len */
  (opts: Partial<ValueControlOpts<T | null>> & { nullable: true }, ...validators: ControlValidator<T | null>[]): ValueBuilder<T | null>
  (opts: true, ...validators: ControlValidator<T | null>[]): ValueBuilder<T | null>
  (...validators: ControlValidator<T>[]): ValueBuilder<T>
  /* eslint-disable-next-line max-len */
  (opts: Partial<ValueControlOpts<T>>  & { nullable?: false }, ...validators: ControlValidator<T>[]): ValueBuilder<T>
  (visibility: ControlVisibility): ValueBuilder<T>
}

export const string: BuiltinValueBuilderFn<string> = injectBuiltinValidators(
  ValueBuilder,
  valueType('string')
)
export const number: BuiltinValueBuilderFn<number> = injectBuiltinValidators(
  ValueBuilder,
  valueType('number')
)
export const boolean: BuiltinValueBuilderFn<boolean> = injectBuiltinValidators(
  ValueBuilder,
  valueType('boolean')
)