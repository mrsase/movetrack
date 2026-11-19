import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers.js';

const BOM = '\uFEFF';

async function seed(app: ReturnType<typeof makeApp>) {
  const box = await request(app).post('/api/boxes').send({ label: 'Cables', destination: 'Floor 3' });
  const item = await request(app)
    .post('/api/items')
    .send({ name: 'HDMI cable', category: 'cable', quantity: 4, box_id: box.body.id });
  await request(app).post(`/api/items/${item.body.id}/box`).send({ box_id: box.body.id });
  return { box: box.body, item: item.body };
}

describe('GET /api/export/items.csv', () => {
  it('returns UTF-8 CSV with a BOM, attachment headers and a header row', async () => {
    const app = makeApp();
    await seed(app);
    const res = await request(app).get('/api/export/items.csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="movetrack-items-\d{4}-\d{2}-\d{2}\.csv"/);
    expect(res.text.startsWith(BOM)).toBe(true);
    expect(res.text.split('\r\n')[0]).toBe(
      `${BOM}id,name,category,serial,quantity,status,box_id,box_label,destination,notes,created_at,updated_at`,
    );
  });

  it('joins the box label and keeps numbers unquoted', async () => {
    const app = makeApp();
    const { box } = await seed(app);
    const res = await request(app).get('/api/export/items.csv');
    const row = res.text.split('\r\n')[1] ?? '';
    expect(row).toContain(',4,packed,');
    expect(row).toContain(`,${box.id},Cables,`);
  });

  it('escapes commas, quotes and newlines per RFC 4180', async () => {
    const app = makeApp();
    const name = 'Monitor, 27" "retina"\nsecond line';
    await request(app).post('/api/items').send({ name, category: 'monitor' });
    const res = await request(app).get('/api/export/items.csv');
    expect(res.text).toContain('"Monitor, 27"" ""retina""\nsecond line"');
  });

  it('neutralises spreadsheet formulas', async () => {
    const app = makeApp();
    await request(app).post('/api/items').send({ name: '=SUM(A1:A9)', category: 'other' });
    await request(app).post('/api/items').send({ name: '+add', category: 'other' });
    await request(app).post('/api/items').send({ name: '@mention', category: 'other' });
    const res = await request(app).get('/api/export/items.csv');
    expect(res.text).toContain(`'=SUM(A1:A9)`);
    expect(res.text).toContain(`'+add`);
    expect(res.text).toContain(`'@mention`);
  });

  it('exports headers only when nothing exists', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/export/items.csv');
    expect(res.status).toBe(200);
    const lines = res.text.split('\r\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('id,name,category');
  });
});

describe('GET /api/export/boxes.csv', () => {
  it('includes computed item counts', async () => {
    const app = makeApp();
    await seed(app);
    const res = await request(app).get('/api/export/boxes.csv');
    const lines = res.text.split('\r\n').filter(Boolean);
    expect(lines[0]).toBe(`${BOM}id,label,status,destination,items_total,created_at,updated_at`);
    expect(lines[1]).toContain(',open,Floor 3,1,');
  });
});

describe('GET /api/export/backup.json', () => {
  it('contains app, version, timestamp and both collections', async () => {
    const app = makeApp();
    await seed(app);
    const res = await request(app).get('/api/export/backup.json');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ app: 'movetrack', version: 1 });
    expect(typeof res.body.exported_at).toBe('string');
    expect(res.body.boxes).toHaveLength(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ name: 'HDMI cable', status: 'packed' });
  });
});

describe('POST /api/import/backup', () => {
  async function backupOf(app: ReturnType<typeof makeApp>) {
    return (await request(app).get('/api/export/backup.json')).body;
  }

  async function restore(app: ReturnType<typeof makeApp>, backup: Record<string, unknown>) {
    return request(app)
      .post('/api/import/backup')
      .send({ ...backup, confirmation: 'replace-all' });
  }

  it('round-trips every row, id and timestamp into a fresh database', async () => {
    const source = makeApp();
    await seed(source);
    const backup = await backupOf(source);

    const target = makeApp();
    const res = await restore(target, backup);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ imported: { boxes: 1, items: 1 } });

    const after = await backupOf(target);
    expect(after.items).toEqual(backup.items);
    expect(after.boxes).toEqual(backup.boxes);
  });

  it('replaces existing data instead of merging', async () => {
    const source = makeApp();
    await seed(source);
    const backup = await backupOf(source);

    const target = makeApp();
    await request(target).post('/api/items').send({ name: 'stale item', category: 'other' });
    await restore(target, backup);

    const items = await request(target).get('/api/items');
    expect(items.body.total).toBe(1);
    expect(items.body.data[0].name).toBe('HDMI cable');
  });

  it('rejects a restore without the confirmation token and writes nothing', async () => {
    const app = makeApp();
    await seed(app);
    const backup = await backupOf(app);

    const res = await request(app).post('/api/import/backup').send(backup);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('confirmation');

    const items = await request(app).get('/api/items');
    expect(items.body.total).toBe(1);
  });

  it('rejects a wrong version and leaves the database untouched', async () => {
    const app = makeApp();
    await seed(app);
    const backup = await backupOf(app);
    backup.version = 2;

    const res = await restore(app, backup);
    expect(res.status).toBe(400);
    expect(res.body.details?.[0]).toContain('version');
    expect((await request(app).get('/api/items')).body.total).toBe(1);
  });

  it('rejects an unknown category', async () => {
    const app = makeApp();
    const res = await restore(app, {
      app: 'movetrack',
      version: 1,
      boxes: [],
      items: [{ id: 1, name: 'x', category: 'hovercraft', status: 'in_office', quantity: 1 }],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.details)).toContain('category');
  });

  it('rejects an item pointing at a box that is not in the payload', async () => {
    const app = makeApp();
    const res = await restore(app, {
      app: 'movetrack',
      version: 1,
      boxes: [],
      items: [{ id: 1, name: 'x', category: 'other', status: 'packed', quantity: 1, box_id: 42 }],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.details)).toContain('box_id');
  });

  it('rejects duplicate ids', async () => {
    const app = makeApp();
    const item = { id: 7, name: 'x', category: 'other', status: 'in_office', quantity: 1 };
    const res = await restore(app, { app: 'movetrack', version: 1, boxes: [], items: [item, { ...item }] });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.details)).toContain('duplicated');
  });

  it('rejects malformed timestamps', async () => {
    const app = makeApp();
    const res = await restore(app, {
      app: 'movetrack',
      version: 1,
      boxes: [{ id: 1, status: 'open', created_at: 'yesterday', updated_at: 'yesterday' }],
      items: [],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.details)).toContain('ISO-8601');
  });
});
