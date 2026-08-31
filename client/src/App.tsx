import { useCallback, useMemo, useState } from 'react';
import type { TabName } from './components/BottomNav';
import type { Route, Nav } from './nav';
import { Home } from './views/Home';
import { Items } from './views/Items';
import { ItemForm } from './views/ItemForm';
import { ItemDetail } from './views/ItemDetail';
import { Boxes } from './views/Boxes';
import { BoxForm } from './views/BoxForm';
import { BoxView } from './views/BoxDetail';
import { BottomNav } from './components/BottomNav';
import { Fab } from './components/Fab';

const TAB_ROOT: Record<TabName, Route> = {
  overview: { name: 'home' },
  items: { name: 'items' },
  boxes: { name: 'boxes' },
};

export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const route = stack[stack.length - 1] as Route;

  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const goTab = useCallback((tab: TabName) => setStack([TAB_ROOT[tab]]), []);

  const nav: Nav = useMemo(() => ({ route, push, pop, replace, goTab }), [route, push, pop, replace, goTab]);

  const tab: TabName =
    route.name === 'home' ? 'overview' : route.name.startsWith('item') || route.name.startsWith('item-') ? 'items' : 'boxes';

  const fab =
    route.name === 'home' || route.name === 'items'
      ? { label: 'Add item', onClick: () => push({ name: 'item-new' }) }
      : route.name === 'boxes'
        ? { label: 'New box', onClick: () => push({ name: 'box-new' }) }
        : null;

  return (
    <div className="app">
      {renderRoute(route, nav)}
      {fab && <Fab label={fab.label} onClick={fab.onClick} />}
      <BottomNav active={tab} onChange={goTab} />
    </div>
  );
}

function renderRoute(route: Route, nav: Nav) {
  switch (route.name) {
    case 'home':
      return <Home nav={nav} />;
    case 'items':
      return <Items nav={nav} />;
    case 'item-new':
      return <ItemForm nav={nav} />;
    case 'item':
      return <ItemDetail nav={nav} />;
    case 'item-edit':
      return <ItemForm nav={nav} item={route.item} />;
    case 'boxes':
      return <Boxes nav={nav} />;
    case 'box-new':
      return <BoxForm nav={nav} />;
    case 'box':
      return <BoxView nav={nav} />;
  }
}