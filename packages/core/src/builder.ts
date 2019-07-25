import Control from './control'
/* eslint-disable-next-line max-len */
import { ControlValidator, mergeOpts, ControlShortOpts } from './common'
import ValueControl, { ValueControlOpts } from './value'
import ArrayControl from './array'
import ObjectControl from './object'
import { ChildrenValue } from './controlWithChildren'
import { isNil } from './util';

export type Builder<T = {}, C extends Control<T> = Control<T>> = (
  (item: T) => C
)

export type ValueBuilder<T> = (value: T) => ValueControl<T>

export function ValueBuilder<T>(
  opts: true | ControlShortOpts<T, ValueControlOpts<T>> = {},
  ...validators: ControlValidator<T>[]
): ValueBuilder<T> {
  const merged = mergeOpts<T, ValueControlOpts<T>>(opts, validators)
  return init => new ValueControl(init, merged)
}

export type ArrayBuilderControls<B> = (
  B extends (init: infer X) => infer Y ?
    (Y extends Control<X> ? Y[] : never) :
    never
)

export type ArrayBuilderValue<B> = (
  B extends (init: infer X) => Control<infer X> ? X[] : never
)

/* eslint-disable-next-line max-len */
export type ArrayBuilder<B, T extends ChildrenValue<ArrayBuilderControls<B>> = ChildrenValue<ArrayBuilderControls<B>>> = (
  (items: ArrayBuilderValue<B>) => ArrayControl<ArrayBuilderControls<B>, T>
)

export type ArrayInitiator<T> = (
  <B>(itemBuilder: B & Builder<T>) => (
    T extends ChildrenValue<ArrayBuilderControls<B>> ? ArrayBuilder<B, T> : never
  )
)

export function ArrayInitiator<T>(
  opts: ControlShortOpts<T> = {},
  ...validators: ControlValidator<T>[]
): ArrayInitiator<T> {
  const merged = mergeOpts(opts, validators)
  return itemBuilder => (
    ((init: any) => new ArrayControl(init.map(itemBuilder as any), merged as any)) as any
  )
}

export type ObjectBuilderControls<OB> = {
  [P in keyof OB]: (
    OB[P] extends (init: infer X) => infer Y ? (Y extends Control<X> ? Y : never) : never
  )
}


/* eslint-disable-next-line max-len */
export type ObjectBuilder<OB, T extends ChildrenValue<ObjectBuilderControls<OB>> = ChildrenValue<ObjectBuilderControls<OB>>> = (
  (item: Partial<T>) => ObjectControl<ObjectBuilderControls<OB>, T>
)

export type ObjectControlBuilders<B> = (B extends ObjectBuilder<infer X> ? X : never )

export type ObjectInitiator<T> = (
  <OB>(controlBuilders: OB & { [P in keyof T]: Builder<T[P]> }) => (
    T extends ChildrenValue<ObjectBuilderControls<OB>> ? ObjectBuilder<OB, T> : never
  )
)

export function ObjectInitiator<T>(
  opts: ControlShortOpts<T> = {},
  ...validators: ControlValidator<T>[]
): ObjectInitiator<T> {
  const merged = mergeOpts(opts, validators)
  return controlBuilders => (
    ((init: any) => {
      const controls = Object.keys(controlBuilders).reduce((acc, key) => (
        {...acc, [key]: ((controlBuilders as any)[key] as any)(isNil(init[key]) ? null : init[key])}
      ), {} as any)
      return new ObjectControl(controls, merged as any) as any
    }) as any
  )
}

export type ObjectBuilderValue<B> = (B extends ObjectBuilder<any, infer Y> ? Y : never)

export type ObjectBuilderType<B> = (
  B extends ObjectBuilder<infer X, infer Y> ? ObjectControl<ObjectBuilderControls<X>, Y> : never
)
