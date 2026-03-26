import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { SetTypeBadge } from './SetTypeBadge';
import type { SetType } from '../../types/workout';

const meta = {
  title: 'Shared/SetTypeBadge',
  component: SetTypeBadge,
  tags: ['autodocs'],
  args: { onChangeType: fn() },
  decorators: [
    (Story) => <div className="p-4"><Story /></div>,
  ],
} satisfies Meta<typeof SetTypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: { type: 'normal', index: 0 },
};

export const Warmup: Story = {
  args: { type: 'warmup', index: 0 },
};

export const Dropset: Story = {
  args: { type: 'dropset', index: 0 },
};

export const ReadOnly: Story = {
  args: { type: 'normal', index: 2, onChangeType: undefined },
};

export const AllVariants: Story = {
  args: { index: 0 },
  render: () => (
    <div className="flex gap-2 p-4">
      <SetTypeBadge type="normal" index={0} />
      <SetTypeBadge type="warmup" index={1} />
      <SetTypeBadge type="dropset" index={2} />
    </div>
  ),
};

export const CycleTypes: Story = {
  args: { index: 0 },
  render: (args) => {
    const [type, setType] = useState<SetType>('normal');
    return (
      <SetTypeBadge
        type={type}
        index={0}
        onChangeType={(t) => { setType(t); args.onChangeType?.(t); }}
      />
    );
  },
  play: async ({ canvas, args }) => {
    const badge = canvas.getByRole('button');
    await userEvent.click(badge); // normal → warmup
    await expect(args.onChangeType).toHaveBeenCalledWith('warmup');
    await userEvent.click(badge); // warmup → dropset
    await expect(args.onChangeType).toHaveBeenCalledWith('dropset');
  },
};
