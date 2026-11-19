import type { TabName } from './components/BottomNav';
import type { Item } from './types';

export type Route =
  | { name: 'home' }
  | { name: 'items' }
  | { name: 'item-new' }
  | { name: 'item'; id: number }
  | { name: 'item-edit'; id: number; item: Item }
  | { name: 'boxes' }
  | { name: 'box-new' }
  | { name: 'box'; id: number }
  | { name: 'labels'; id?: number };

export interface Nav {
  route: Route;
  push: (route: Route) => void;
  pop: () => void;
  /** Swap the top of the stack (e.g. item-new -> item detail). */
  replace: (route: Route) => void;
  goTab: (tab: TabName) => void;
}