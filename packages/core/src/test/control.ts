import Control from '../control'
import ValueControl from '../value'
import { ControlOpts, mergeOpts, ControlValidator } from '../common';

export class TestControl extends Control<string> {
  readonly opts: Partial<ControlOpts<string>>
  constructor(
    init: string | null = '🥝',
    opts: Partial<ControlOpts<string>> = {},
    ...validators: ControlValidator<string>[]
    ) {
    super(init, opts, ...validators)
    this.opts = mergeOpts(opts, validators)
  }

  clone(): TestControl {
    return new TestControl(this.value, this.opts)
  }

  setValue(value: unknown, opts: { keepPristine? : boolean } = {}): void {
    ValueControl.prototype.setValue.call(this, value, opts)
  }
}
