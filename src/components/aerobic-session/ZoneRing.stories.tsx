import type { Meta, StoryObj } from '@storybook/react-vite';
import { ZoneRing } from './ZoneRing';

const meta = {
  title: 'Aerobic Session/ZoneRing',
  component: ZoneRing,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    zone: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '5a', '5b', '5c'],
    },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof ZoneRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Zone1Full: Story = {
  args: { zone: '1', progress: 1 },
};

export const Zone3Half: Story = {
  args: { zone: '3', progress: 0.5 },
};

export const Zone5cEmpty: Story = {
  args: { zone: '5c', progress: 0 },
};

export const AllZones: Story = {
  args: { zone: '1', progress: 0.65 },
  render: () => (
    <div className="flex flex-wrap gap-6 p-4 justify-center">
      {(['1', '2', '3', '4', '5', '5a', '5b', '5c'] as const).map((zone) => (
        <ZoneRing key={zone} zone={zone} progress={0.65} size={120} />
      ))}
    </div>
  ),
};
