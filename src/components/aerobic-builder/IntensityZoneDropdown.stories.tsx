import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { IntensityZoneDropdown } from './IntensityZoneDropdown';
import type { IntensityZone } from '../../types/aerobic';

const meta = {
  title: 'Aerobic Builder/IntensityZoneDropdown',
  component: IntensityZoneDropdown,
  tags: ['autodocs'],
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IntensityZoneDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Zone1Selected: Story = { args: { value: '1' } };
export const Zone3Selected: Story = { args: { value: '3' } };
export const Zone5cSelected: Story = { args: { value: '5c' } };

export const OpenAndSelect: Story = {
  args: { value: '1' },
  render: (args) => {
    const [zone, setZone] = useState<IntensityZone>('1');
    return (
      <IntensityZoneDropdown
        value={zone}
        onChange={(z) => { setZone(z); args.onChange(z); }}
      />
    );
  },
  play: async ({ canvas, args }) => {
    // Open dropdown
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
    // Select Zone 4
    const zone4 = canvas.getByText('Zona 4');
    await userEvent.click(zone4);
    await expect(args.onChange).toHaveBeenCalledWith('4');
  },
};
