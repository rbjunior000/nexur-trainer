import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, expect } from 'storybook/test';
import { AerobicBuilderProvider } from './AerobicBuilderContext';
import { StepCard } from './StepCard';
import { mockAerobicWorkout } from '../../stories/fixtures';

const block = mockAerobicWorkout.blocks[1];
const step = block.steps[0];

const meta = {
  title: 'Aerobic Builder/StepCard',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicBuilderProvider initialWorkout={mockAerobicWorkout}>
        <div className="p-4 max-w-sm">
          <Story />
        </div>
      </AerobicBuilderProvider>
    ),
  ],
  render: () => <StepCard blockId={block.id} step={step} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimeStep: Story = {};

export const DistanceStep: Story = {
  render: () => (
    <StepCard
      blockId={mockAerobicWorkout.blocks[2].id}
      step={mockAerobicWorkout.blocks[2].steps[0]}
    />
  ),
};

export const OpenEditModal: Story = {
  play: async ({ canvas }) => {
    // hover to reveal actions, then click edit
    const card = canvas.getByText('Sprint').closest('div')!;
    await userEvent.hover(card);
    const editBtn = canvas.getAllByRole('button').find(
      (b) => b.querySelector('svg') !== null && b.className.includes('yellow')
    );
    if (editBtn) {
      await userEvent.click(editBtn);
      await expect(canvas.getByText('Nome')).toBeInTheDocument();
    }
  },
};
