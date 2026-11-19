import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';
import { ToastProvider } from '../components/Toast';
import type { Nav } from '../nav';
import type { Stats } from '../types';

vi.mock('../api', () => ({
  api: { stats: vi.fn(), boxes: vi.fn(), items: vi.fn(), restoreBackup: vi.fn() },
}));

import { api } from '../api';

const EMPTY: Stats = {
  items: {
    total: 0,
    in_office: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    byCategory: [],
    recent: [],
  },
  boxes: { total: 0, open: 0, sealed: 0, shipped: 0, arrived: 0, unpacked: 0 },
};

const FULL: Stats = {
  items: {
    total: 12,
    in_office: 5,
    packed: 4,
    shipped: 2,
    delivered: 1,
    byCategory: [
      { category: 'mac', count: 8 },
      { category: 'cable', count: 4 },
    ],
    recent: [
      {
        id: 1,
        name: 'MacBook Pro',
        category: 'mac',
        status: 'in_office',
        quantity: 1,
        destination: null,
        created_at: '2026-08-31T12:00:00.000Z',
      },
    ],
  },
  boxes: { total: 3, open: 2, sealed: 0, shipped: 1, arrived: 0, unpacked: 0 },
};

function makeNav(): Nav {
  return {
    route: { name: 'home' },
    push: vi.fn(),
    pop: vi.fn(),
    replace: vi.fn(),
    goTab: vi.fn(),
  };
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.boxes).mockResolvedValue({ data: [] });
    vi.mocked(api.items).mockResolvedValue({ data: [], total: 0 });
  });

  it('renders the empty state when nothing is registered', async () => {
    vi.mocked(api.stats).mockResolvedValue(EMPTY);
    render(
      <ToastProvider>
        <Home nav={makeNav()} />
      </ToastProvider>,
    );
    expect(await screen.findByText(/nothing registered yet/i)).toBeInTheDocument();
  });

  it('shows totals, flow stats, categories and recent items', async () => {
    vi.mocked(api.stats).mockResolvedValue(FULL);
    vi.mocked(api.boxes).mockResolvedValue({
      data: [
        {
          id: 1,
          label: 'Cables',
          destination: 'Floor 3',
          status: 'open',
          created_at: '2026-08-31T12:00:00.000Z',
          updated_at: '2026-08-31T12:00:00.000Z',
          items_total: 2,
          items_shipped: 0,
          items_delivered: 0,
        },
      ],
    });
    const nav = makeNav();
    render(
      <ToastProvider>
        <Home nav={nav} />
      </ToastProvider>,
    );

    expect(await screen.findByTestId('total-items')).toHaveTextContent('12');
    expect(statValue('In office')).toContain('5');
    expect(statValue('Packed')).toContain('4');
    expect(statValue('Shipped')).toContain('2');
    expect(statValue('Delivered')).toContain('1');
    expect(screen.getByText(/3 boxes/)).toBeInTheDocument();
    expect(screen.getByText(/MacBook Pro/)).toBeInTheDocument();

    // tapping a recent item opens its detail
    await userEvent.click(screen.getByText(/MacBook Pro/));
    expect(nav.push).toHaveBeenCalledWith({ name: 'item', id: 1 });
  });
});

/** Value inside a .stat card, keyed by its label. */
function statValue(label: string): string {
  const stat = screen.getAllByText(label).map((el) => el.closest('.stat')).find(Boolean) as HTMLElement;
  return stat.querySelector('.stat__value')?.textContent ?? '';
}