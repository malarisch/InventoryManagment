"use client";

import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

export type FormProps<TFieldValues extends FieldValues = FieldValues> = UseFormReturn<TFieldValues> & {
  children: React.ReactNode;
};

export function Form<TFieldValues extends FieldValues>(props: FormProps<TFieldValues>) {
  const { children, ...form } = props;
  return <FormProvider {...(form as UseFormReturn<TFieldValues>)}>{children}</FormProvider>;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: {
  name: TName;
  control?: Control<TFieldValues>;
  render: (params: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
  }) => React.ReactElement;
}) {
  const ctx = useFormContext<TFieldValues>();
  const control = props.control ?? ctx.control;
  return <Controller name={props.name} control={control} render={props.render} />;
}

export function FormItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function FormLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

export function FormControl({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FormMessage({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-600">{children}</p>;
}
