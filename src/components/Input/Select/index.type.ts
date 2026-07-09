import type {
  SelectIndicatorProps as HeroSelectIndicatorProps,
  SelectPopoverProps as HeroSelectPopoverProps,
  SelectProps as HeroSelectProps,
  SelectTriggerProps as HeroSelectTriggerProps,
  SelectValueProps as HeroSelectValueProps,
} from '@heroui/react';

export type SelectProps<
  T extends object = object,
  M extends 'single' | 'multiple' = 'single',
> = HeroSelectProps<T, M>;
export type SelectTriggerProps = HeroSelectTriggerProps;
export type SelectValueProps = HeroSelectValueProps;
export type SelectIndicatorProps = HeroSelectIndicatorProps;
export type SelectPopoverProps = HeroSelectPopoverProps;
