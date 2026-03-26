import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, expect } from 'storybook/test';
import { StepModal } from './StepModal';
import type { BlockStep } from '../../types/aerobic';

const mockStep: BlockStep = {
  id: 'step-1',
  name: 'Aquecimento',
  durationType: 'TIME',
  duration: '00:10:00',
  intensity: '2',
  level: 1,
};

const meta = {
  title: 'Aerobic Builder/StepModal',
  component: StepModal,
  tags: ['autodocs'],
  args: {
    open: true,
    step: mockStep,
    onSave: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-h-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DistanceStep: Story = {
  args: {
    step: { ...mockStep, durationType: 'DISTANCE', duration: '2000', intensity: '4' },
  },
};

export const Closed: Story = {
  args: { open: false },
};

export const CloseButton: Story = {
  play: async ({ canvas, args }) => {
    const closeBtn = canvas.getByText('Fechar');
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalled();
  },
};
