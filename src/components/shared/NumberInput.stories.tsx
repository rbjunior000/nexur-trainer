import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { NumberInput } from './NumberInput';

const meta = {
  title: 'Shared/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  args: { value: 80, suffix: 'kg', variant: 'light' },
};

export const Dark: Story = {
  args: { value: 10, suffix: 'reps', variant: 'dark' },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-xs bg-gray-900 rounded">
        <Story />
      </div>
    ),
  ],
};

export const NoSuffix: Story = {
  args: { value: 5 },
};

export const Empty: Story = {
  args: { value: undefined, placeholder: '—' },
};

export const TypeValue: Story = {
  args: { value: 0 },
  render: (args) => {
    const [val, setVal] = useState<number | undefined>(0);
    return (
      <NumberInput
        value={val}
        onChange={(v) => { setVal(v); args.onChange(v); }}
        suffix="kg"
      />
    );
  },
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '75');
    await expect(args.onChange).toHaveBeenCalled();
  },
};
