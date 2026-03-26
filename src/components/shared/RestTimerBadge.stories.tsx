import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { RestTimerBadge } from './RestTimerBadge';

const meta = {
  title: 'Shared/RestTimerBadge',
  component: RestTimerBadge,
  tags: ['autodocs'],
  args: { onChange: fn() },
  decorators: [
    (Story) => <div className="p-4 max-w-xs"><Story /></div>,
  ],
} satisfies Meta<typeof RestTimerBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnlyOff: Story = {
  args: { value: 0, onChange: undefined },
};

export const ReadOnly60s: Story = {
  args: { value: 60, onChange: undefined },
};

export const ReadOnly2min: Story = {
  args: { value: 120, onChange: undefined },
};

export const Editable: Story = {
  args: { value: 60 },
};

export const EditableDark: Story = {
  args: { value: 30, variant: 'dark' },
  decorators: [
    (Story) => <div className="p-4 max-w-xs bg-gray-900 rounded"><Story /></div>,
  ],
};

export const ChangePreset: Story = {
  args: { value: 60 },
  render: (args) => {
    const [val, setVal] = useState(60);
    return (
      <RestTimerBadge
        value={val}
        onChange={(v) => { setVal(v); args.onChange?.(v); }}
      />
    );
  },
  play: async ({ canvas, args }) => {
    const select = canvas.getByRole('combobox');
    await userEvent.selectOptions(select, '90');
    await expect(args.onChange).toHaveBeenCalledWith(90);
  },
};
