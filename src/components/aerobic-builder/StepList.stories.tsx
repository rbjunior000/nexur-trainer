import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, expect } from 'storybook/test';
import { AerobicBuilderProvider } from './AerobicBuilderContext';
import { StepList } from './StepList';
import { mockAerobicWorkout } from '../../stories/fixtures';

const block = mockAerobicWorkout.blocks[1]; // Intervalados — 2 steps

const meta = {
  title: 'Aerobic Builder/StepList',
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
  render: () => <StepList blockId={block.id} steps={block.steps} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleStep: Story = {
  render: () => (
    <StepList
      blockId={mockAerobicWorkout.blocks[0].id}
      steps={mockAerobicWorkout.blocks[0].steps}
    />
  ),
};

export const AddStep: Story = {
  play: async ({ canvas }) => {
    const addBtn = canvas.getByText('Adicionar Step');
    await userEvent.click(addBtn);
    const steps = canvas.getAllByText(/Step|Sprint|Recuperação/);
    await expect(steps.length).toBeGreaterThanOrEqual(3);
  },
};
