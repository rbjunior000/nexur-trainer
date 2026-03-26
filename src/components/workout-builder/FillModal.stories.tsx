import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { FillModal } from './FillModal';

const meta = {
  title: 'Workout Builder/FillModal',
  component: FillModal,
  tags: ['autodocs'],
  args: {
    open: true,
    onApply: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof FillModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Closed: Story = {
  args: { open: false },
};

export const ApplyFill: Story = {
  play: async ({ canvas, args }) => {
    // Click "Aplicar" button
    const applyBtn = canvas.getByText('Aplicar');
    await userEvent.click(applyBtn);
    await expect(args.onApply).toHaveBeenCalled();
  },
};
