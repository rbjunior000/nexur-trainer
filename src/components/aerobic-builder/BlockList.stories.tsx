import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, expect } from 'storybook/test';
import { AerobicBuilderProvider } from './AerobicBuilderContext';
import { BlockList } from './BlockList';
import type { AerobicWorkout } from '../../types/aerobic';
import { DEFAULT_BLOCKS } from '../../types/aerobic';

const defaultWorkout: AerobicWorkout = {
  workoutName: 'Treino Aeróbico',
  workoutStartDate: '',
  workoutEndDate: '',
  workoutDescription: '',
  sport: 'running',
  blocks: DEFAULT_BLOCKS,
};

const meta = {
  title: 'Aerobic Builder/BlockList',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicBuilderProvider initialWorkout={defaultWorkout}>
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </AerobicBuilderProvider>
    ),
  ],
  render: () => <BlockList />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyWorkout: Story = {
  decorators: [
    (Story) => (
      <AerobicBuilderProvider
        initialWorkout={{ ...defaultWorkout, blocks: [] }}
      >
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </AerobicBuilderProvider>
    ),
  ],
};

export const AddBlock: Story = {
  play: async ({ canvas }) => {
    const addBtn = canvas.getByText('Adicionar Bloco');
    await userEvent.click(addBtn);
    // New block is named 'Bloco'; verify its name input appears
    await expect(canvas.getByDisplayValue('Bloco')).toBeInTheDocument();
  },
};
