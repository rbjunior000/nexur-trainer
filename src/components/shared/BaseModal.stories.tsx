import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { useState } from 'react';
import { BaseModal } from './BaseModal';

const meta = {
  title: 'Shared/BaseModal',
  component: BaseModal,
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: fn(),
    title: 'Modal Title',
    children: <p className="p-4 text-gray-600">Modal content goes here.</p>,
  },
  decorators: [
    (Story) => (
      <div className="min-h-64 relative">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BaseModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sheet: Story = {
  args: { sheet: true, title: 'Bottom Sheet' },
};

export const NoTitle: Story = {
  args: { title: undefined },
};

export const Closed: Story = {
  args: { open: false },
};

export const CloseOnXButton: Story = {
  play: async ({ canvas, args }) => {
    const closeBtn = canvas.getByRole('button');
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          className="px-4 py-2 bg-yellow-400 font-bold rounded"
          onClick={() => setOpen(true)}
        >
          Open Modal
        </button>
        <BaseModal open={open} onClose={() => setOpen(false)} title="Controlled">
          <p className="p-4 text-gray-600">This modal is fully controlled.</p>
        </BaseModal>
      </>
    );
  },
  play: async ({ canvas }) => {
    const openBtn = canvas.getByText('Open Modal');
    await userEvent.click(openBtn);
    await expect(canvas.getByText('Controlled')).toBeInTheDocument();
  },
};
