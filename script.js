const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());

// Simple in-memory data storage
let purchases = [100000];
let transfers = [50];
let assignments = [250];

// Simple user list for demo and basic authentication via headers (just for demo)
const users = {
  admin: { role: 'Admin', base: null },
  commander1: { role: 'Base Commander', base: 'Base Alpha' },
  logistics: { role: 'Logistics Officer', base: null },
};

// Middleware to simulate authentication & attach user info
app.use((req, res, next) => {
  const username = req.headers['x-username']; // pass username in header for demo
  if (!username || !users[username]) {
    return res.status(401).send('Unauthorized: Provide valid X-Username header');
  }
  req.user = { username, ...users[username] };
  next();
});

// Role-based access control middleware
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).send('Forbidden: Insufficient role');
    }
    next();
  };
}

// Route to record a purchase
app.post('/purchases', authorize(['Admin', 'Base Commander', 'Logistics Officer']), (req, res) => {
  const { base, type, quantity, date } = req.body;
  if (!base || !type || !quantity || !date) {
    return res.status(400).send('Missing fields');
  }
  if (req.user.role === 'Base Commander' && req.user.base !== base) {
    return res.status(403).send('Base Commander can only add purchases for their base');
  }
  const purchase = {
    id: purchases.length + 1,
    base,
    type,
    quantity,
    date,
  };
  purchases.push(purchase);
  res.status(201).send(purchase);
});

// Route to list purchases
app.get('/purchases', authorize(['Admin', 'Base Commander', 'Logistics Officer']), (req, res) => {
  // Filter for Base Commander to own base only
  let result = purchases;
  if (req.user.role === 'Base Commander') {
    result = purchases.filter(p => p.base === req.user.base);
  }
  res.send(result);
});

// Route to record a transfer
app.post('/transfers', authorize(['Admin', 'Base Commander']), (req, res) => {
  const { fromBase, toBase, type, quantity, date } = req.body;
  if (!fromBase || !toBase || !type || !quantity || !date) {
    return res.status(400).send('Missing fields');
  }
  if (req.user.role === 'Base Commander' && req.user.base !== fromBase) {
    return res.status(403).send('Base Commander can only transfer from their base');
  }
  const transfer = {
    id: transfers.length + 1,
    fromBase,
    toBase,
    type,
    quantity,
    date,
  };
  transfers.push(transfer);
  res.status(201).send(transfer);
});

// Route to list transfers
app.get('/transfers', authorize(['Admin', 'Base Commander', 'Logistics Officer']), (req, res) => {
  // Filter for Base Commander to show transfers from or to their base
  let result = transfers;
  if (req.user.role === 'Base Commander') {
    result = transfers.filter(t => t.fromBase === req.user.base || t.toBase === req.user.base);
  }
  res.send(result);
});

// Route to record an assignment or expenditure
app.post('/assignments', authorize(['Admin', 'Base Commander']), (req, res) => {
  const { base, type, quantity, date, personnel, status } = req.body;
  if (!base || !type || !quantity || !date || !status) {
    return res.status(400).send('Missing fields');
  }
  if (status === 'Assigned' && !personnel) {
    return res.status(400).send('Personnel required for assignment');
  }
  if (req.user.role === 'Base Commander' && req.user.base !== base) {
    return res.status(403).send('Base Commander can only assign assets for their base');
  }
  const assignment = {
    id: assignments.length + 1,
    base,
    type,
    quantity,
    date,
    personnel: personnel || null,
    status,
  };
  assignments.push(assignment);
  res.status(201).send(assignment);
});

// Route to list assignments & expenditures
app.get('/assignments', authorize(['Admin', 'Base Commander']), (req, res) => {
  // Filter for Base Commander to own base only
  let result = assignments;
  if (req.user.role === 'Base Commander') {
    result = assignments.filter(a => a.base === req.user.base);
  }
  res.send(result);
});

// Dashboard summary
app.get('/dashboard', authorize(['Admin', 'Base Commander', 'Logistics Officer']), (req, res) => {
  // Calculate opening balance, closing balance, net movement, assigned and expended for user's base or all bases for admin
  let baseFilter = req.user.role === 'Base Commander' ? req.user.base : null;

  const filterByBase = (list) =>
    baseFilter ? list.filter(item => item.base === baseFilter || item.toBase === baseFilter || item.fromBase === baseFilter) : list;

  const purchasesSum = filterByBase(purchases).reduce((sum, i) => sum + i.quantity, 0);
  const transfersIn = filterByBase(transfers).reduce((sum, i) => (i.toBase === baseFilter ? sum + i.quantity : sum), 0);
  const transfersOut = filterByBase(transfers).reduce((sum, i) => (i.fromBase === baseFilter ? sum + i.quantity : sum), 0);
  const assignedSum = filterByBase(assignments).filter(a => a.status === 'Assigned').reduce((sum, i) => sum + i.quantity, 0);
  const expendedSum = filterByBase(assignments).filter(a => a.status === 'Expended').reduce((sum, i) => sum + i.quantity, 0);

  const openingBalance = 0; // For simplicity, not calculated here
  const netMovement = purchasesSum + transfersIn - transfersOut;
  const closingBalance = openingBalance + netMovement - expendedSum;

  res.send({
    openingBalance,
    closingBalance,
    netMovement,
    purchases: purchasesSum,
    transfersIn,
    transfersOut,
    assigned: assignedSum,
    expended: expendedSum,
  });
});

app.listen(port, () => {
  console.log(`Military Asset Management backend running on http://localhost:${5500}`);
});
