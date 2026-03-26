import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent } from 'storybook/test';
import { useState } from 'react';
import { SportSelector } from './SportSelector';
import type { Sport } from '../../types/aerobic';

const meta = {
  title: 'Aerobic Builder/SportSelector',
  component: SportSelector,
  tags: ['autodocs'],
  args: { onChange: fn() },
} satisfies Meta<typeof SportSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {
  args: { value: 'running' },
};

export const Cycling: Story = {
  args: { value: 'cycling' },
};

export const Swimming: Story = {
  args: { value: 'swimming' },
};

export const Controlled: Story = {
  args: { value: 'running' },
  render: (args) => {
    const [sport, setSport] = useState<Sport>('running');
    return <SportSelector value={sport} onChange={(s) => { setSport(s); args.onChange(s); }} />;
  },
  play: async ({ canvas }) => {
    const cyclingBtn = canvas.getByText('Ciclismo');
    await userEvent.click(cyclingBtn);
    await expect(cyclingBtn.closest('button')).toHaveClass('bg-yellow-400');
  },
};
