function runOrdersCrudExample() {
  const db = SheetCollection.connect({
    source: "google"
  });
  const orders = db.collection("orders");
  const runId = "DEMO-" + Date.now();

  orders.insertMany([
    {
      orderNumber: runId + "-001",
      customer: "Ada Lovelace",
      email: "ada@example.com",
      status: "pending",
      total: 129.9,
      createdAt: new Date()
    },
    {
      orderNumber: runId + "-002",
      customer: "Grace Hopper",
      email: "grace@example.com",
      status: "pending",
      total: 89.5,
      createdAt: new Date()
    }
  ]);

  const insertedOrders = orders.findAll().filter(function (order) {
    return order.orderNumber.indexOf(runId) === 0;
  });

  if (insertedOrders.length !== 2) {
    throw new Error("Could not find both orders inserted by this run.");
  }

  const firstOrder = orders.findById(insertedOrders[0].id);
  const updated = orders.update(insertedOrders[0].id, {
    status: "paid"
  });
  const deleted = orders.delete(insertedOrders[1].id);

  Logger.log(JSON.stringify({
    foundById: firstOrder,
    updated: updated,
    deleted: deleted,
    remainingOrders: orders.findAll().filter(function (order) {
      return order.orderNumber.indexOf(runId) === 0;
    })
  }));
}
