import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Training Session/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-gray-900 max-w-sm rounded">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { progress: 0 } };
export const Quarter: Story = { args: { progress: 0.25 } };
export const Half: Story = { args: { progress: 0.5 } };
export const ThreeQuarters: Story = { args: { progress: 0.75 } };
export const Full: Story = { args: { progress: 1 } };
