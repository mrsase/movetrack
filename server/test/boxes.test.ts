import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers.js';

describe('POST /api/boxes', () => {
  it('auto-labels boxes with sequential names', async () => {
    const app = makeApp();
    const a = await request(app).post('/api/boxes').send({});
    expect(a.status).toBe(201);
    expect(a.body).toMatchObject({ label: 'Box 1', status: 'open', items_total: 0 });

    const b = await request(app).post('/api/boxes').send({ destination: 'Kitchen' });
    expect(b.body.label).toBe('Box 2');
    expect(b.body.destination).toBe('Kitchen');
  });

  it('keeps an explicit label', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/boxes').send({ label: 'Cables — floor 3' });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('Cables — floor 3');
  });
});

describe('box lifecycle and the pack/ship/arrive/unpack flow', () => {
  async function freshBox(app: ReturnType<typeof makeApp>) {
    const box = await request(app).post('/api/boxes').send({ label: 'AV gear' });
    const item = await request(app).post('/api/items').send({ name: 'Projector', category: 'peripheral' });
    return { box: box.body, item: item.body };
  }

  it('acts as the transport for item status', async () => {
    const app = makeApp();
    const { box, item } = await freshBox(app);

    // pack → item is packed inside the box
    const packed = await request(app).post(`/api/items/${item.id}/box`).send({ box_id: box.id });
    expect(packed.status).toBe(200);
    expect(packed.body).toMatchObject({ status: 'packed', box_id: box.id });

    const boxDetail = await request(app).get(`/api/boxes/${box.id}`);
    expect(boxDetail.body.items_total).toBe(1);
    expect(boxDetail.body.items[0]).toMatchObject({ name: 'Projector', status: 'packed' });

    // seal, reopen, seal again
    expect((await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'seal' })).body.status).toBe('sealed');
    expect((await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'reopen' })).body.status).toBe('open');
    await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'seal' });

    // ship → items become shipped
    const shipped = await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'ship' });
    expect(shipped.body.status).toBe('shipped');
    const afterShip = await request(app).get(`/api/boxes/${box.id}`);
    expect(afterShip.body.items[0].status).toBe('shipped');
    expect(afterShip.body.items_shipped).toBe(1);

    // arrive, then unpack → items delivered
    await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'arrive' });
    const unpacked = await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'unpack' });
    expect(unpacked.body.status).toBe('unpacked');
    const afterUnpack = await request(app).get(`/api/boxes/${box.id}`);
    expect(afterUnpack.body.items[0].status).toBe('delivered');
    expect(afterUnpack.body.items_delivered).toBe(1);
  });

  it('rejects out-of-order transitions', async () => {
    const app = makeApp();
    const { box } = await freshBox(app);
    // ship from open is allowed, arrive before shipped is not
    const arrive = await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'arrive' });
    expect(arrive.status).toBe(409);
    // unknown action
    const bogus = await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'explode' });
    expect(bogus.status).toBe(400);
  });

  it('blocks packing into a non-open box', async () => {
    const app = makeApp();
    const { box } = await freshBox(app);
    await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'ship' });
    const item = await request(app).post('/api/items').send({ name: 'Speakers' });
    const res = await request(app).post(`/api/items/${item.body.id}/box`).send({ box_id: box.id });
    expect(res.status).toBe(409);
  });

  it('blocks packing an item that is already boxed or delivered', async () => {
    const app = makeApp();
    const boxA = await request(app).post('/api/boxes').send({});
    const boxB = await request(app).post('/api/boxes').send({});
    const item = await request(app).post('/api/items').send({ name: 'Monitor' });
    await request(app).post(`/api/items/${item.body.id}/box`).send({ box_id: boxA.body.id });
    const twice = await request(app).post(`/api/items/${item.body.id}/box`).send({ box_id: boxB.body.id });
    expect(twice.status).toBe(409);
  });

  it('unboxes an item back to the office', async () => {
    const app = makeApp();
    const { box, item } = await freshBox(app);
    await request(app).post(`/api/items/${item.id}/box`).send({ box_id: box.id });

    const unboxed = await request(app).delete(`/api/items/${item.id}/box`);
    expect(unboxed.body).toMatchObject({ box_id: null, status: 'in_office' });

    const unboxedAgain = await request(app).delete(`/api/items/${item.id}/box`);
    expect(unboxedAgain.status).toBe(409);
  });

  it('unboxing an unpacked box keeps the item delivered', async () => {
    const app = makeApp();
    const { box, item } = await freshBox(app);
    await request(app).post(`/api/items/${item.id}/box`).send({ box_id: box.id });
    await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'ship' });
    await request(app).post(`/api/boxes/${box.id}/action`).send({ action: 'unpack' });

    const unboxed = await request(app).delete(`/api/items/${item.id}/box`);
    expect(unboxed.body.status).toBe('delivered');
  });

  it('deleting a box sends its contents back to the office', async () => {
    const app = makeApp();
    const { box, item } = await freshBox(app);
    await request(app).post(`/api/items/${item.id}/box`).send({ box_id: box.id });

    const res = await request(app).delete(`/api/boxes/${box.id}`);
    expect(res.status).toBe(204);

    const itemAfter = await request(app).get(`/api/items/${item.id}`);
    expect(itemAfter.body).toMatchObject({ box_id: null, status: 'in_office' });
  });
});

describe('PATCH /api/boxes/:id', () => {
  it('renames a box and changes its destination', async () => {
    const app = makeApp();
    const box = await request(app).post('/api/boxes').send({});
    const res = await request(app).patch(`/api/boxes/${box.body.id}`).send({ label: 'Heavy — hallway', destination: 'Ops' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ label: 'Heavy — hallway', destination: 'Ops' });
  });
});