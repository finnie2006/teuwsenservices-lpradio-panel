import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Input } from '@grafana/ui';

// The built-in text input turns an empty field into undefined, and Grafana then restores the default
// value on load. This editor stores an empty string, so that a field can really be left empty.
export const ClearableTextEditor = ({ value, onChange, id }: StandardEditorProps<string>) => {
  const commit = (input: HTMLInputElement) => {
    const nextValue = input.value.trim();

    if (nextValue !== (value ?? '')) {
      onChange(nextValue);
    }
  };

  return (
    <Input
      id={id}
      defaultValue={value ?? ''}
      onBlur={(event) => commit(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit(event.currentTarget);
        }
      }}
    />
  );
};
