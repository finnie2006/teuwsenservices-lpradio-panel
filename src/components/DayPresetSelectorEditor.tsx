import React, { useMemo } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Combobox } from '@grafana/ui';
import { SimpleOptions, StationPresetId } from '../types';

type DayPresetValue = StationPresetId | 'none';

interface DayPresetSelectorSettings {
  dayKey: keyof SimpleOptions['dayPresetSelection'];
}

const presetIds: StationPresetId[] = ['preset1', 'preset2', 'preset3', 'preset4', 'preset5'];
const MAX_PRESET_NAME_LENGTH = 32;

const truncatePresetName = (value: string): string => {
  if (value.length <= MAX_PRESET_NAME_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_PRESET_NAME_LENGTH - 3).trimEnd()}...`;
};

export const DayPresetSelectorEditor = ({ value, onChange, context }: StandardEditorProps<DayPresetValue, DayPresetSelectorSettings>) => {
  const options = useMemo(() => {
    const baseOptions: Array<{ value: DayPresetValue; label: string }> = [
      { value: 'none', label: 'No preset (use custom day station)' },
    ];

    presetIds.forEach((presetId, index) => {
      const presetName = context?.options?.stationPresets?.[presetId]?.name?.trim() ?? '';
      const label =
        presetName.length > 0 ? `Preset ${index + 1} - ${truncatePresetName(presetName)}` : `Preset ${index + 1}`;
      baseOptions.push({ value: presetId, label });
    });

    return baseOptions;
  }, [context?.options]);

  const selectedValue = value ?? 'none';

  return (
    <Combobox
      width={34}
      options={options}
      value={selectedValue}
      onChange={(selection) => onChange((selection.value ?? 'none') as DayPresetValue)}
    />
  );
};
