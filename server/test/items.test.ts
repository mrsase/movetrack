import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers.js';

describe('POST /api/items', () => {
  it('creates an item with defaults', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'MacBook Pro 16"', category: 'mac', serial: 'C02XK1ZZJGH5' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'MacBook Pro 16"',
      category: 'mac',
      serial: 'C02XK1ZZJGH5',
      quantity: 1,
      status: 'in_office',
      box_id: null,
      notes: null,
      destination: null,
    });
    expect(typeof res.body.id).toBe('number');
  });

  it('accepts optional fields and a quantity', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/items').send({
      name: 'HDMI cables',
      category: 'cable',
      quantity: 12,
      notes: 'assorted lengths',
      destination: 'Server room',
    });
    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(12);
    expect(res.body.destination).toBe('Server room');
  });

  it('rejects a missing name', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/items').send({ category: 'other' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('name');
  });

  it('rejects an unknown category', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/items').send({ name: 'Thing', category: 'hovercraft' });
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive quantity', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/items').send({ name: 'Cables', quantity: 0 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/items', () => {
  async function seed(app: ReturnType<typeof makeApp>) {
    await request(app).post('/api/items').send({ name: 'iMac 27"', category: 'mac', serial: 'ABC123' });
    await request(app).post('/api/items').send({ name: 'Dell dock', category: 'peripheral', notes: 'dock for laptops' });
    await request(app).post('/api/items').send({ name: 'Hard drive 4TB', category: 'storage' });
  }

  it('lists items newest first', async () => {
    const app = makeApp();
    await seed(app);
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.data.map((i: { name: string }) => i.name)).toEqual([
      'Hard drive 4TB',
      'Dell dock',
      'iMac 27"',
    ]);
  });

  it('filters by status and category', async () => {
    const app = makeApp();
    await seed(app);
    const res = await request(app).get('/api/items?category=mac');
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name).toBe('iMac 27"');
  });

  it('searches name, serial and notes', async () => {
    const app = makeApp();
    await seed(app);
    const bySerial = await request(app).get('/api/items?q=abc123');
    expect(bySerial.body.total).toBe(1);
    const byNotes = await request(app).get('/api/items?q=dock');
    expect(byNotes.body.total).toBe(1);
  });

  it('pages with limit and offset', async () => {
    const app = makeApp();
    await seed(app);
    const res = await request(app).get('/api/items?limit=2&offset=1');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(3);
  });
});

describe('PATCH /api/items/:id', () => {
  it('updates editable fields', async () => {
    const app = makeApp();
    const created = await request(app).post('/api/items').send({ name: 'Keyboard' });
    const res = await request(app)
      .patch(`/api/items/${created.body.id}`)
      .send({ name: 'Magic Keyboard', quantity: 2, serial: 'A1843' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Magic Keyboard', quantity: 2, serial: 'A1843' });
  });

  it('rejects setting status when the item is boxed', async () => {
    const app = makeApp();
    const item = await request(app).post('/api/items').send({ name: 'Router' });
    const box = await request(app).post('/api/boxes').send({});
    await request(app).post(`/api/items/${item.body.id}/box`).send({ box_id: box.body.id });
    const res = await request(app).patch(`/api/items/${item.body.id}`).send({ status: 'in_office' });
    expect(res.status).toBe(409);
  });

  it('404s for unknown items', async () => {
    const app = makeApp();
    const res = await request(app).patch('/api/items/9999').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/items/:id', () => {
  it('removes the item', async () => {
    const app = makeApp();
    const created = await request(app).post('/api/items').send({ name: 'Scrap PC' });
    const res = await request(app).delete(`/api/items/${created.body.id}`);
    expect(res.status).toBe(204);
    const gone = await request(app).get(`/api/items/${created.body.id}`);
    expect(gone.status).toBe(404);
  });
});