import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { ColorBar } from './ColorBar';

const meta = {
  title: 'Workout Builder/ColorBar',
  component: ColorBar,
  tags: ['autodocs'],
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div className="p-8 h-24 flex items-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ColorBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { color: '#FBBF24' },
};

export const NoColor: Story = {
  args: { color: undefined },
};

export const PlacementBelow: Story = {
  args: { color: '#4488FF', placement: 'below' },
};

export const OpenPicker: Story = {
  args: { color: '#4488FF' },
  play: async ({ canvas }) => {
    const strip = canvas.getByRole('button', { name: 'Cor do exercício' });
    await userEvent.click(strip);
    // Color grid should appear
    const colorBtns = canvas.getAllByRole('button');
    await expect(colorBtns.length).toBeGreaterThan(5);
  },
};

export const SelectColor: Story = {
  args: { color: '#4488FF' },
  render: (args) => {
    const [color, setColor] = useState('#4488FF');
    return (
      <ColorBar color={color} onChange={(hex) => { setColor(hex); args.onChange(hex); }} />
    );
  },
  play: async ({ canvas, args }) => {
    const strip = canvas.getByRole('button', { name: 'Cor do exercício' });
    await userEvent.click(strip);
    const btns = canvas.getAllByRole('button');
    // Pick second color button (skip the strip itself)
    await userEvent.click(btns[1]);
    await expect(args.onChange).toHaveBeenCalled();
  },
};
