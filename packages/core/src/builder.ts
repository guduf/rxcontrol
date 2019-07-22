import Control from './control'
/* eslint-disable-next-line max-len */
import { ControlValidator, mergeOpts, ControlShortOpts } from './common'
import ValueControl, { ValueControlOpts } from './value'
import ArrayControl from './array'
import ObjectControl from './object'
import { ChildrenValue } from './controlWithChildren'

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

export type FieldBuilderControls<FB> = {
  [P in keyof FB]: (
    FB[P] extends (init: infer X) => infer Y ?
      (Y extends Control<X> ? Y : never) :
      never
  )
}

export type FieldBuildersValue<FB> = {
  [P in keyof FB]: FB[P] extends (init: infer X) => Control<infer X> ? X : never
}

/* eslint-disable-next-line max-len */
export type ObjectBuilder<FB, T extends ChildrenValue<FieldBuilderControls<FB>> = ChildrenValue<FieldBuilderControls<FB>>> = (
  (
    item: { [P in keyof FieldBuildersValue<FB>]: FieldBuildersValue<FB>[P] | null }
  ) => ObjectControl<FieldBuilderControls<FB>, T>
)

export type ObjectInitiator<T> = (
  <FB>(fieldBuilders: FB & { [P in keyof T]: Builder<T[P]> }) => (
    T extends ChildrenValue<FieldBuilderControls<FB>> ? ObjectBuilder<FB, T> : never
  )
)

export function ObjectInitiator<T>(
  opts: ControlShortOpts<T> = {},
  ...validators: ControlValidator<T>[]
): ObjectInitiator<T> {
  const merged = mergeOpts(opts, validators)
  return fieldBuilders => (
    ((init: any) => {
      const fields = Object.keys(fieldBuilders).reduce((acc, key) => (
        {...acc, [key]: ((fieldBuilders as any)[key] as any)(init[key])}
      ), {} as any)
      return new ObjectControl(fields, merged as any) as any
    }) as any
  )
}

export type ObjectBuilderValue<GB> = (
  GB extends ObjectBuilder<infer X> ? FieldBuildersValue<X> : never
)

export type ObjectBuilderType<GB> = (
  GB extends ObjectBuilder<infer X, infer Y> ?
    ObjectControl<FieldBuilderControls<X>, Y> :
    never
)
