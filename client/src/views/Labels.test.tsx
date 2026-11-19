import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Labels } from './Labels';
import type { Nav } from '../nav';
import type { Box } from '../types';

vi.mock('../api', () => ({
  api: { boxes: vi.fn() },
}));

import { api } from '../api';

const box = (over: Partial<Box> & Pick<Box, 'id' | 'label' | 'status'>): Box => ({
  destination: null,
  created_at: '2026-08-31T12:00:00.000Z',
  updated_at: '2026-08-31T12:00:00.000Z',
  items_total: 3,
  items_shipped: 0,
  items_delivered: 0,
  ...over,
});

const BOXES: Box[] = [
  box({ id: 1, label: 'Cables — floor 3', status: 'open', items_total: 4, destination: 'Floor 3 · Comms room' }),
  box({ id: 2, label: 'Design studio', status: 'sealed', items_total: 4, destination: 'Floor 2 · Studio' }),
  box({ id: 3, label: 'Bookshelf A', status: 'unpacked', items_total: 18 }),
];

function makeNav(): Nav {
  return {
    route: { name: 'labels' },
    push: vi.fn(),
    pop: vi.fn(),
    replace: vi.fn(),
    goTab: vi.fn(),
  };
}

describe('Labels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.boxes).mockResolvedValue({ data: BOXES });
  });

  it('prints one label per active box and skips unpacked ones', async () => {
    render(<Labels nav={makeNav()} />);
    expect(await screen.findByText('Cables — floor 3')).toBeInTheDocument();
    expect(screen.getByText('Design studio')).toBeInTheDocument();
    expect(screen.queryByText('Bookshelf A')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('shows the destination and item count on the label', async () => {
    render(<Labels nav={makeNav()} />);
    expect(await screen.findByText('→ Floor 3 · Comms room')).toBeInTheDocument();
    expect(screen.getAllByText(/4 items/)).toHaveLength(2);
  });

  it('honours the single-box filter, including an unpacked box', async () => {
    render(<Labels nav={makeNav()} onlyBoxId={3} />);
    expect(await screen.findByText('Bookshelf A')).toBeInTheDocument();
    expect(screen.queryByText('Cables — floor 3')).not.toBeInTheDocument();
  });

  it('retries the load when the error action is used', async () => {
    vi.mocked(api.boxes)
      .mockRejectedValueOnce(new Error('Could not reach the server'))
      .mockResolvedValueOnce({ data: BOXES });
    render(<Labels nav={makeNav()} />);
    const retry = await screen.findByRole('button', { name: 'Try again' });
    await userEvent.click(retry);
    expect(await screen.findByText('Cables — floor 3')).toBeInTheDocument();
    expect(api.boxes).toHaveBeenCalledTimes(2);
  });

  it('explains the empty state', async () => {
    vi.mocked(api.boxes).mockResolvedValue({ data: [BOXES[2] as Box] });
    render(<Labels nav={makeNav()} />);
    expect(await screen.findByText('Nothing to print')).toBeInTheDocument();
  });
});
