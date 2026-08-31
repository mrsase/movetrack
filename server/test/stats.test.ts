import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers.js';

describe('GET /api/stats', () => {
  it('reports zeros on an empty database', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.items).toMatchObject({ total: 0, in_office: 0, packed: 0, shipped: 0, delivered: 0 });
    expect(res.body.items.byCategory).toEqual([]);
    expect(res.body.boxes).toMatchObject({ total: 0, open: 0, sealed: 0, shipped: 0, arrived: 0, unpacked: 0 });
  });

  it('reflects the current state of items and boxes', async () => {
    const app = makeApp();

    // one item stays in office, one gets packed + shipped in a box
    await request(app).post('/api/items').send({ name: 'Spare mouse', category: 'input' });
    const mac = await request(app).post('/api/items').send({ name: 'Mac Mini', category: 'mac' });
    const box = await request(app).post('/api/boxes').send({});
    await request(app).post(`/api/items/${mac.body.id}/box`).send({ box_id: box.body.id });
    await request(app).post(`/api/boxes/${box.body.id}/action`).send({ action: 'ship' });

    const res = await request(app).get('/api/stats');
    expect(res.body.items.total).toBe(2);
    expect(res.body.items.in_office).toBe(1);
    expect(res.body.items.packed).toBe(0);
    expect(res.body.items.shipped).toBe(1);
    expect(res.body.items.byCategory).toEqual([
      { category: 'input', count: 1 },
      { category: 'mac', count: 1 },
    ]);
    expect(res.body.boxes.total).toBe(1);
    expect(res.body.boxes.shipped).toBe(1);
    expect(res.body.items.recent).toHaveLength(2);
  });
});

describe('GET /api/health', () => {
  it('responds ok with an item count', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.items).toBe('number');
  });
});