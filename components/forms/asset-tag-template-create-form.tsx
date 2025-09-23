
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AssetTagTemplate, AssetTagTemplateElement } from '@/components/asset-tag-templates/types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  width: z.number().min(1, 'Width must be at least 1'),
  height: z.number().min(1, 'Height must be at least 1'),
  elements: z.array(z.object({
    type: z.enum(['text', 'qrcode', 'barcode']),
    x: z.number(),
    y: z.number(),
    value: z.string(),
  })),
});

export function AssetTagTemplateCreateForm() {
  const form = useForm<AssetTagTemplate>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      width: 100,
      height: 50,
      elements: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'elements',
  });

  const onSubmit = (values: AssetTagTemplate) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Template" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width (mm)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height (mm)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <h3 className="text-lg font-medium">Elements</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-4">
              <FormField
                control={form.control}
                name={`elements.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="qrcode">QR Code</SelectItem>
                        <SelectItem value="barcode">Barcode</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`elements.${index}.x`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`elements.${index}.y`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Y</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`elements.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ type: 'text', x: 0, y: 0, value: '' })}
          >
            Add Element
          </Button>
        </div>

        <Button type="submit">Create Template</Button>
      </form>
    </Form>
  );
}
