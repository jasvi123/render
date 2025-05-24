import React, { useState, useEffect } from "react";

const ROLES = {
  ADMIN: "Admin",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

// Sample data for bases and equipment types
const bases = ["Base Alpha", "Base Bravo", "Base Charlie"];
const equipmentTypes = ["Weapons", "Vehicles", "Ammunition"];

// Dummy user for demo (change role here to test)
const demoUser = {
  username: "john.doe",
  role: ROLES.ADMIN,
  base: "Base Alpha", // For Base Commander role
};

// Helper to filter transactions by filter criteria
const filterBy = (items, filters) => {
  return items.filter((item) => {
    if (filters.date && item.date !== filters.date) return false;
    if (filters.base && item.base !== filters.base) return false;
    if (filters.equipmentType && item.type !== filters.equipmentType)
      return false;
    return true;
  });
};

function App() {
  // State for role-based access
  const [currentUser, setCurrentUser] = useState(demoUser);

  // Data states
  const [purchases, setPurchases] = useState([
    {
      id: 1,
      date: "2024-06-01",
      base: "Base Alpha",
      type: "Weapons",
      quantity: 10,
    },
    {
      id: 2,
      date: "2024-06-03",
      base: "Base Bravo",
      type: "Vehicles",
      quantity: 5,
    },
  ]);
  const [transfers, setTransfers] = useState([
    {
      id: 1,
      date: "2024-06-04",
      fromBase: "Base Alpha",
      toBase: "Base Bravo",
      type: "Weapons",
      quantity: 3,
    },
  ]);
  const [assignments, setAssignments] = useState([
    {
      id: 1,
      date: "2024-06-05",
      base: "Base Bravo",
      type: "Weapons",
      quantity: 2,
      personnel: "Captain Smith",
      status: "Assigned",
    },
    {
      id: 2,
      date: "2024-06-06",
      base: "Base Bravo",
      type: "Weapons",
      quantity: 1,
      status: "Expended",
    },
  ]);

  // Filter states
  const [filters, setFilters] = useState({
    date: "",
    base: "",
    equipmentType: "",
  });

  // Navigation state
  const [page, setPage] = useState("dashboard");

  // Computed values:

  // Opening Balance: Assume sum of purchases before filtered date (simplified)
  const openingBalance = purchases.reduce(
    (acc, p) =>
      filters.date && p.date < filters.date &&
      (currentUser.role !== ROLES.BASE_COMMANDER || p.base === currentUser.base)
        ? acc + p.quantity
        : acc,
    0
  );

  // Closing Balance: purchases + transfer ins - transfer outs - assignments expended (simplified)
  const filteredPurchases = filterBy(purchases, filters).filter(
    (p) =>
      currentUser.role !== ROLES.BASE_COMMANDER || p.base === currentUser.base
  );

  const transferIn = transfers.reduce(
    (acc, t) =>
      filters.date && t.date <= filters.date &&
      (filters.base === "" || filters.base === t.toBase) &&
      (currentUser.role !== ROLES.BASE_COMMANDER || t.toBase === currentUser.base)
        ? acc + t.quantity
        : acc,
    0
  );

  const transferOut = transfers.reduce(
    (acc, t) =>
      filters.date && t.date <= filters.date &&
      (filters.base === "" || filters.base === t.fromBase) &&
      (currentUser.role !== ROLES.BASE_COMMANDER || t.fromBase === currentUser.base)
        ? acc + t.quantity
        : acc,
    0
  );

  const expended = assignments.reduce(
    (acc, a) =>
      filters.date && a.date <= filters.date &&
      a.status === "Expended" &&
      (filters.base === "" || filters.base === a.base) &&
      (currentUser.role !== ROLES.BASE_COMMANDER || a.base === currentUser.base)
        ? acc + a.quantity
        : acc,
    0
  );

  const assigned = assignments.reduce(
    (acc, a) =>
      filters.date && a.date <= filters.date &&
      a.status === "Assigned" &&
      (filters.base === "" || filters.base === a.base) &&
      (currentUser.role !== ROLES.BASE_COMMANDER || a.base === currentUser.base)
        ? acc + a.quantity
        : acc,
    0
  );

  const netMovement = filteredPurchases.reduce((acc, p) => acc + p.quantity, 0) + transferIn - transferOut;

  // Handlers for adding data (simplified)

  const addPurchase = (purchase) => {
    setPurchases([...purchases, { id: purchases.length + 1, ...purchase }]);
  };

  const addTransfer = (transfer) => {
    setTransfers([...transfers, { id: transfers.length + 1, ...transfer }]);
  };

  const addAssignment = (assignment) => {
    setAssignments([...assignments, { id: assignments.length + 1, ...assignment }]);
  };

  // Role based visibility helpers

  const canViewPurchases =
    currentUser.role === ROLES.ADMIN ||
    currentUser.role === ROLES.BASE_COMMANDER ||
    currentUser.role === ROLES.LOGISTICS_OFFICER;

  const canViewTransfers =
    currentUser.role === ROLES.ADMIN ||
    currentUser.role === ROLES.BASE_COMMANDER ||
    currentUser.role === ROLES.LOGISTICS_OFFICER;

  const canViewAssignments =
    currentUser.role === ROLES.ADMIN ||
    currentUser.role === ROLES.BASE_COMMANDER;

  // UI Components

  const Filters = () => (
    <div style={{marginBottom: '1em'}}>
      <label>
        Date:{" "}
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
      </label>{" "}
      <label>
        Base:{" "}
        <select
          value={filters.base}
          onChange={(e) => setFilters({ ...filters, base: e.target.value })}
        >
          <option value="">All</option>
          {bases.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        Equipment Type:{" "}
        <select
          value={filters.equipmentType}
          onChange={(e) => setFilters({ ...filters, equipmentType: e.target.value })}
        >
          <option value="">All</option>
          {equipmentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <button style={{marginLeft:"15px"}} onClick={() => setFilters({ date:"", base:"", equipmentType:"" })}>Clear Filters</button>
    </div>
  );

  const Dashboard = () => (
    <div>
      <h2>Dashboard</h2>
      <Filters />
      <div style={{display:"flex", gap:"20px", flexWrap:"wrap"}}>
        <Metric title="Opening Balance" value={openingBalance} />
        <Metric title="Closing Balance" value={openingBalance + netMovement - expended} />
        <Metric title="Net Movement" value={netMovement} onClick={() => alert(`Purchases: ${filteredPurchases.reduce((acc, p) => acc + p.quantity, 0)}\nTransfer In: ${transferIn}\nTransfer Out: ${transferOut}`)} />
        <Metric title="Assigned" value={assigned} />
        <Metric title="Expended" value={expended} />
      </div>
    </div>
  );

  const Metric = ({ title, value, onClick }) => (
    <div
      style={{
        backgroundColor: "#1e90ff",
        color: "white",
        padding: "15px 25px",
        borderRadius: "8px",
        cursor: onClick ? "pointer" : "default",
        minWidth: "140px",
        textAlign:"center",
      }}
      onClick={onClick}
      title={onClick ? `Click to see details of ${title}` : ""}
    >
      <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>{value}</div>
      <div>{title}</div>
    </div>
  );

  const PurchasesPage = () => {
    const [form, setForm] = useState({
      date: "",
      base: currentUser.role === ROLES.BASE_COMMANDER ? currentUser.base : "",
      type: "",
      quantity: 0,
    });

    // Filtered purchases for viewing
    const filtered = filterBy(purchases, filters).filter(
      (p) => currentUser.role !== ROLES.BASE_COMMANDER || p.base === currentUser.base
    );

    return (
      <div>
        <h2>Purchases</h2>
        <Filters />
        {(currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.BASE_COMMANDER || currentUser.role === ROLES.LOGISTICS_OFFICER) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.date && form.base && form.type && form.quantity > 0) {
                addPurchase(form);
                setForm({ date: "", base: currentUser.role === ROLES.BASE_COMMANDER ? currentUser.base : "", type: "", quantity: 0 });
              } else {
                alert("Please complete the form");
              }
            }}
            style={{ marginBottom: "1em" }}
          >
            <label>
              Date:{" "}
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>{" "}
            <label>
              Base:{" "}
              {currentUser.role === ROLES.BASE_COMMANDER ? (
                <input type="text" value={form.base} disabled />
              ) : (
                <select
                  value={form.base}
                  onChange={(e) => setForm({ ...form, base: e.target.value })}
                >
                  <option value="">Select Base</option>
                  {bases.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </label>{" "}
            <label>
              Equipment Type:{" "}
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select Type</option>
                {equipmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>{" "}
            <label>
              Quantity:{" "}
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              />
            </label>{" "}
            <button type="submit">Add Purchase</button>
          </form>
        )}
        <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{backgroundColor:"#eef"}}>
              <th>ID</th>
              <th>Date</th>
              <th>Base</th>
              <th>Equipment Type</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.date}</td>
                  <td>{p.base}</td>
                  <td>{p.type}</td>
                  <td>{p.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No purchases found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const TransferPage = () => {
    const [form, setForm] = useState({
      date: "",
      fromBase: currentUser.role === ROLES.BASE_COMMANDER ? currentUser.base : "",
      toBase: "",
      type: "",
      quantity: 0,
    });

    // Filtered transfers for viewing
    const filtered = transfers.filter((t) => {
      if (currentUser.role === ROLES.BASE_COMMANDER) {
        // Only transfers involving base commander base
        return t.fromBase === currentUser.base || t.toBase === currentUser.base;
      }
      return true;
    }).filter((t) => {
      if (filters.date && t.date !== filters.date) return false;
      if (filters.base && t.fromBase !== filters.base && t.toBase !== filters.base) return false;
      if (filters.equipmentType && t.type !== filters.equipmentType) return false;
      return true;
    });

    return (
      <div>
        <h2>Transfers</h2>
        <Filters />
        {(currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.BASE_COMMANDER) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.date && form.fromBase && form.toBase && form.type && form.quantity > 0) {
                if (form.fromBase === form.toBase) {
                  alert("From Base and To Base cannot be the same");
                  return;
                }
                addTransfer(form);
                setForm({ date: "", fromBase: currentUser.role === ROLES.BASE_COMMANDER ? currentUser.base : "", toBase: "", type: "", quantity: 0 });
              } else {
                alert("Please complete the form");
              }
            }}
            style={{ marginBottom: "1em" }}
          >
            <label>
              Date:{" "}
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>{" "}
            <label>
              From Base:{" "}
              {currentUser.role === ROLES.BASE_COMMANDER ? (
                <input type="text" value={form.fromBase} disabled />
              ) : (
                <select
                  value={form.fromBase}
                  onChange={(e) => setForm({ ...form, fromBase: e.target.value })}
                >
                  <option value="">Select Base</option>
                  {bases.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </label>{" "}
            <label>
              To Base:{" "}
              <select
                value={form.toBase}
                onChange={(e) => setForm({ ...form, toBase: e.target.value })}
              >
                <option value="">Select Base</option>
                {bases.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>{" "}
            <label>
              Equipment Type:{" "}
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select Type</option>
                {equipmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>{" "}
            <label>
              Quantity:{" "}
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              />
            </label>{" "}
            <button type="submit">Add Transfer</button>
          </form>
        )}
        <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{backgroundColor:"#eef"}}>
              <th>ID</th>
              <th>Date</th>
              <th>From Base</th>
              <th>To Base</th>
              <th>Equipment Type</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.date}</td>
                  <td>{t.fromBase}</td>
                  <td>{t.toBase}</td>
                  <td>{t.type}</td>
                  <td>{t.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No transfers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const AssignmentsPage = () => {
    const [form, setForm] = useState({
      date: "",
      base: currentUser.role === ROLES.BASE_COMMANDER ? currentUser.base : "",
      type: "",
      quantity: 0,
      personnel: "",
      status: "Assigned",
    });

    // Filtered assignments for viewing
    const filtered = assignments.filter((a) =>
      (!filters.date || a.date === filters.date) &&
      (!filters.base || a.base === filters.base) &&
      (!filters.equipmentType || a.type === filters.equipmentType) &&
      (currentUser.role !== ROLES.BASE_COMMANDER || a.base === currentUser.base)
    );

    return (
      <div>
        <h2>Assignments & Expenditures</h2>
        <Filters />
        {(currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.BASE_COMMANDER) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                form.date &&
                form.base &&
                form.type &&
                form.quantity > 0 &&
                (form.status === "Expended" || (form.status === "Assigned" && form.personnel))
              ) {
                addAssignment(form);
                setForm({
                  date: "",
                  base: currentUser.role === ROLES.BASE_COMMANDER ? currentUser.base : "",
                  type: "",
                  quantity: 0,
                  personnel: "",
                  status: "Assigned",
                });
              } else {
                alert(
                  "Please complete the form. Personnel is required when status is 'Assigned'."
                );
              }
            }}
            style={{ marginBottom: "1em" }}
          >
            <label>
              Date:{" "}
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>{" "}
            <label>
              Base:{" "}
              {currentUser.role === ROLES.BASE_COMMANDER ? (
                <input type="text" value={form.base} disabled />
              ) : (
                <select
                  value={form.base}
                  onChange={(e) => setForm({ ...form, base: e.target.value })}
                >
                  <option value="">Select Base</option>
                  {bases.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </label>{" "}
            <label>
              Equipment Type:{" "}
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select Type</option>
                {equipmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>{" "}
            <label>
              Quantity:{" "}
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              />
            </label>{" "}
            <label>
              Status:{" "}
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Assigned">Assigned</option>
                <option value="Expended">Expended</option>
              </select>
            </label>{" "}
            {form.status === "Assigned" && (
              <label>
                Personnel:{" "}
                <input
                  type="text"
                  value={form.personnel}
                  onChange={(e) => setForm({ ...form, personnel: e.target.value })}
                />
              </label>
            )}{" "}
            <button type="submit">Add Record</button>
          </form>
        )}

        <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{backgroundColor:"#eef"}}>
              <th>ID</th>
              <th>Date</th>
              <th>Base</th>
              <th>Equipment Type</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Personnel</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.date}</td>
                  <td>{a.base}</td>
                  <td>{a.type}</td>
                  <td>{a.quantity}</td>
                  <td>{a.status}</td>
                  <td>{a.status === "Assigned" ? a.personnel : "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Navigation Component
  const Navigation = () => {
    const pages = [
      { id: "dashboard", label: "Dashboard" },
      { id: "purchases", label: "Purchases" },
      { id: "transfers", label: "Transfers" },
      { id: "assignments", label: "Assignments & Expenditures" },
    ];

    // Role-based page filtering
    const accessiblePages = pages.filter((p) => {
      if (p.id === "purchases") {
        return canViewPurchases;
      } else if (p.id === "transfers") {
        return canViewTransfers;
      } else if (p.id === "assignments") {
        return canViewAssignments;
      }
      return true; // dashboard always accessible
    });

    return (
      <nav style={{ marginBottom: "1em", borderBottom: "2px solid #ccc", paddingBottom:"10px" }}>
        {accessiblePages.map((p) => (
          <button
            key={p.id}
            style={{
              marginRight: "10px",
              padding: "8px 18px",
              backgroundColor: page === p.id ? "#1e90ff" : "#ddd",
              color: page === p.id ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => setPage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>
    );
  };

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "auto",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        padding: "20px",
      }}
    >
      <header style={{ marginBottom: "20px", borderBottom: "3px solid #333", paddingBottom: "10px" }}>
        <h1>Military Asset Management System</h1>
        <div>
          Logged in as: <b>{currentUser.username}</b> (<i>{currentUser.role}</i>)
        </div>
      </header>
      <Navigation />
      <main>
        {page === "dashboard" && <Dashboard />}
        {page === "purchases" && canViewPurchases && <PurchasesPage />}
        {page === "transfers" && canViewTransfers && <TransferPage />}
        {page === "assignments" && canViewAssignments && <AssignmentsPage />}
      </main>
      <footer
        style={{
          marginTop: "2em",
          paddingTop: "10px",
          borderTop: "1px solid #ccc",
          fontSize: "0.8em",
          color: "#666",
          textAlign: "center",
        }}
      >
        &copy; 2024 Military Asset Management Demo
      </footer>
    </div>
  );
}

export default App;

