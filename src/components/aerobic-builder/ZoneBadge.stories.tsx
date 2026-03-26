import type { Meta, StoryObj } from '@storybook/react-vite';
import { ZoneBadge } from './ZoneBadge';

const meta = {
  title: 'Aerobic Builder/ZoneBadge',
  component: ZoneBadge,
  tags: ['autodocs'],
  argTypes: {
    zone: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '5a', '5b', '5c'],
    },
    size: { control: 'radio', options: ['sm', 'md'] },
    showLabel: { control: 'boolean' },
  },
} satisfies Meta<typeof ZoneBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Zone1: Story = { args: { zone: '1', size: 'sm' } };
export const Zone3: Story = { args: { zone: '3', size: 'sm' } };
export const Zone5c: Story = { args: { zone: '5c', size: 'sm' } };

export const MediumWithLabel: Story = {
  args: { zone: '4', size: 'md', showLabel: true },
};

export const AllZones: Story = {
  args: { zone: '1' },
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      {(['1', '2', '3', '4', '5', '5a', '5b', '5c'] as const).map((zone) => (
        <ZoneBadge key={zone} zone={zone} size="md" showLabel />
      ))}
    </div>
  ),
};
