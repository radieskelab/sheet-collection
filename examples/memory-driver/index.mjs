import assert from "node:assert/strict";
import "../../dist/SheetCollection.js";

const db = globalThis.SheetDB.connect({
  source: "memory"
});
const orders = db.collection("orders");

orders.insertMany([
  {
    orderNumber: "ORD-2026-001",
    customer: "Ada Lovelace",
    status: "pending",
    total: 129.9
  },
  {
    orderNumber: "ORD-2026-002",
    customer: "Grace Hopper",
    status: "pending",
    total: 89.5
  }
]);

const [firstOrder, secondOrder] = orders.findAll();
assert.deepEqual(orders.findById(firstOrder.id), firstOrder);
assert.equal(orders.update(firstOrder.id, { status: "paid" }), true);
assert.equal(orders.findById(firstOrder.id).status, "paid");
assert.equal(orders.delete(secondOrder.id), true);
assert.deepEqual(orders.findAll(), [
  { ...firstOrder, status: "paid" }
]);

console.log("Memory Driver CRUD example passed.");
