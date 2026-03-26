import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { DurationInput } from './DurationInput';
import type { DurationType } from '../../types/aerobic';

const meta = {
  title: 'Aerobic Builder/DurationInput',
  component: DurationInput,
  tags: ['autodocs'],
  args: {
    onChangeDurationType: fn(),
    onChangeDuration: fn(),
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimeMode: Story = {
  args: {
    durationType: 'TIME',
    duration: '00:05:00',
  },
};

export const DistanceMode: Story = {
  args: {
    durationType: 'DISTANCE',
    duration: '1000',
  },
};

export const Controlled: Story = {
  args: { durationType: 'TIME', duration: '00:05:00' },
  render: (args) => {
    const [type, setType] = useState<DurationType>('TIME');
    const [duration, setDuration] = useState('00:05:00');
    return (
      <DurationInput
        durationType={type}
        duration={duration}
        onChangeDurationType={(t) => { setType(t); args.onChangeDurationType(t); }}
        onChangeDuration={(d) => { setDuration(d); args.onChangeDuration(d); }}
      />
    );
  },
  play: async ({ canvas }) => {
    const distanceBtn = canvas.getByText('Distância');
    await userEvent.click(distanceBtn);
    await expect(distanceBtn).toHaveClass('bg-yellow-400');
  },
};
