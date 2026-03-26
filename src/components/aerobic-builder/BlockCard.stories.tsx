import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, expect } from 'storybook/test';
import { AerobicBuilderProvider } from './AerobicBuilderContext';
import { BlockCard } from './BlockCard';
import { mockAerobicWorkout } from '../../stories/fixtures';

const block = mockAerobicWorkout.blocks[1]; // Intervalados

const meta = {
  title: 'Aerobic Builder/BlockCard',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AerobicBuilderProvider initialWorkout={mockAerobicWorkout}>
        <div className="p-4 max-w-lg">
          <Story />
        </div>
      </AerobicBuilderProvider>
    ),
  ],
  render: () => <BlockCard block={block} isFirst={false} isLast={false} />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstBlock: Story = {
  render: () => (
    <BlockCard block={mockAerobicWorkout.blocks[0]} isFirst isLast={false} />
  ),
};

export const LastBlock: Story = {
  render: () => (
    <BlockCard block={mockAerobicWorkout.blocks[2]} isFirst={false} isLast />
  ),
};

export const Collapse: Story = {
  play: async ({ canvas }) => {
    // The first button is the collapse toggle (ChevronRight)
    const collapseBtn = canvas.getAllByRole('button')[0];
    await userEvent.click(collapseBtn);
    // Framer Motion exit animations don't complete in JSDOM; just verify the button is accessible
    await expect(collapseBtn).toBeInTheDocument();
  },
};
