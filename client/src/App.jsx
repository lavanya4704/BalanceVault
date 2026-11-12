
import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [page, setPage] = useState(() => {
    const token = sessionStorage.getItem("balancevaultToken");
    const user = JSON.parse(sessionStorage.getItem("balancevaultUser") || "null");

    if (!token) return "login";
    return user?.status === "PENDING" ? "pending" : "dashboard";
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
const [showCreateAccount, setShowCreateAccount] = useState(false);
const [accountCreating, setAccountCreating] = useState(false);
const [accountMessage, setAccountMessage] = useState("");
const [accountMessageType, setAccountMessageType] = useState("");
const [transferLoading, setTransferLoading] = useState(false);
const [transferMessage, setTransferMessage] = useState("");
const [transferMessageType, setTransferMessageType] = useState("");
const [pendingUsers, setPendingUsers] = useState([]);
const [auditLogs, setAuditLogs] = useState([]);
const [adminLoading, setAdminLoading] = useState(false);
const [adminMessage, setAdminMessage] = useState("");
const [adminMessageType, setAdminMessageType] = useState("");  
const [user, setUser] = useState(() => {
  try {
    return JSON.parse(sessionStorage.getItem("balancevaultUser") || "null");
  } catch {
    return null;
  }
});

  const isRegister = page === "register";

  const loadDashboard = useCallback(async () => {
    const token = sessionStorage.getItem("balancevaultToken");
    if (!token) {
      setPage("login");
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [accountResponse, transactionResponse] = await Promise.all([
        fetch(`${API_URL}/api/accounts/my-accounts`, { headers }),
        fetch(`${API_URL}/api/transactions/my-transactions`, { headers }),
      ]);

      const accountData = await accountResponse.json();
      const transactionData = await transactionResponse.json();

      if (!accountResponse.ok) {
        throw new Error(accountData.message || "Unable to load accounts.");
      }

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.message || "Unable to load transactions."
        );
      }

      setAccounts(accountData.accounts || []);
      setTransactions(transactionData.transactions || []);
    } catch (error) {
      setDashboardError(error.message || "Unable to load dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

const handleCreateAccount = async (e) => {
  e.preventDefault();

  const token = sessionStorage.getItem("balancevaultToken");

  try {
    setAccountCreating(true);
    setAccountMessage("");

    const response = await fetch(`${API_URL}/api/accounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Account creation failed.");
    }

    setAccountMessage(
      data.message || "Your account was created successfully."
    );
    setAccountMessageType("success");
    setShowCreateAccount(false);

    await loadDashboard();
  } catch (error) {
    setAccountMessage(error.message || "Unable to create account.");
    setAccountMessageType("error");
  } finally {
    setAccountCreating(false);
  }
};
const handleTransfer = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;
  const formData = new FormData(form);

  const fromAccountNumber = formData.get("fromAccountNumber");
  const toAccountNumber = formData.get("toAccountNumber").trim();
  const amount = formData.get("amount");
  const description = formData.get("description").trim();

  if (fromAccountNumber === toAccountNumber) {
    setTransferMessage("Sender and receiver accounts must be different.");
    setTransferMessageType("error");
    return;
  }

  if (Number(amount) <= 0) {
    setTransferMessage("Transfer amount must be greater than zero.");
    setTransferMessageType("error");
    return;
  }

  try {
    setTransferLoading(true);
    setTransferMessage("");

    const token = sessionStorage.getItem("balancevaultToken");

    const response = await fetch(`${API_URL}/api/transactions/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromAccountNumber,
        toAccountNumber,
        amount,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Transfer failed.");
    }

    setTransferMessage(data.message || "Transfer completed successfully.");
    setTransferMessageType("success");

    form.reset();
    await loadDashboard();
  } catch (error) {
    setTransferMessage(error.message || "Unable to complete transfer.");
    setTransferMessageType("error");
  } finally {
    setTransferLoading(false);
  }
};
const loadAdminData = useCallback(async () => {
  const token = sessionStorage.getItem("balancevaultToken");

  try {
    setAdminLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    const [usersResponse, logsResponse] = await Promise.all([
      fetch(`${API_URL}/api/admin/pending-users`, { headers }),
      fetch(`${API_URL}/api/admin/audit-logs`, { headers }),
    ]);

    const usersData = await usersResponse.json();
    const logsData = await logsResponse.json();

    if (!usersResponse.ok) {
      throw new Error(usersData.message || "Unable to load pending users.");
    }

    if (!logsResponse.ok) {
      throw new Error(logsData.message || "Unable to load audit logs.");
    }

    setPendingUsers(usersData.requests || []);
    setAuditLogs(logsData.logs || []);
  } catch (error) {
    setAdminMessage(error.message);
    setAdminMessageType("error");
  } finally {
    setAdminLoading(false);
  }
}, []);

const handleReviewUser = async (userId, status) => {
  const remarks = window.prompt("Enter remarks (optional):") || "";
  const token = sessionStorage.getItem("balancevaultToken");

  try {
    const response = await fetch(
      `${API_URL}/api/admin/users/${userId}/review`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, remarks }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to review user.");
    }

    setAdminMessage(data.message);
    setAdminMessageType("success");
    await loadAdminData();
  } catch (error) {
    setAdminMessage(error.message);
    setAdminMessageType("error");
  }
};

const handleAddDemoFunds = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;
  const formData = new FormData(form);
  const accountNumber = formData.get("accountNumber").trim();
  const amount = formData.get("demoAmount");
  const remarks = formData.get("remarks").trim();
  const token = sessionStorage.getItem("balancevaultToken");

  try {
    const response = await fetch(
      `${API_URL}/api/admin/accounts/${accountNumber}/demo-fund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, remarks }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to add demo funds.");
    }

    setAdminMessage(data.message);
    setAdminMessageType("success");
    form.reset();
    await loadAdminData();
    await loadDashboard();
  } catch (error) {
    setAdminMessage(error.message);
    setAdminMessageType("error");
  }
};
useEffect(() => {
  if (page === "dashboard") {
    loadDashboard();

    if (user?.role === "ADMIN") {
      loadAdminData();
    }
  }
}, [page, loadDashboard, loadAdminData, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");

    if (isRegister) {
      const name = formData.get("name");
      const phone = formData.get("phone");
      const confirmPassword = formData.get("confirmPassword");

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setMessageType("error");
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed.");
        }

        setPage("login");
        setMessage(
          data.message ||
            "Registration successful. Your account is pending admin approval."
        );
        setMessageType("success");
        form.reset();
      } catch (error) {
        setMessage(error.message || "Unable to connect to the server.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }

      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.token) {
        throw new Error("The server did not return an authentication token.");
      }

      sessionStorage.setItem("balancevaultToken", data.token);

      if (data.user) {
        sessionStorage.setItem(
          "balancevaultUser",
          JSON.stringify(data.user)
        );
        setUser(data.user);
      }

      if (data.user?.status === "PENDING") {
        setPage("pending");
      } else {
        setPage("dashboard");
      }
    } catch (error) {
      setMessage(error.message || "Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const changePage = () => {
    setPage(isRegister ? "login" : "register");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMessage("");
    setMessageType("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("balancevaultToken");
    sessionStorage.removeItem("balancevaultUser");
    setAccounts([]);
    setTransactions([]);
    setUser(null);
    setMessage("");
    setMessageType("");
    setPage("login");
  };

  const formatAmount = (amount, currency = "INR") => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // PENDING APPROVAL SCREEN
  if (page === "pending") {
    return (
      <main className="vault-page">
        <section className="login-panel" style={{ width: "100%" }}>
          <div className="login-content">
            <div className="login-heading">
              <p className="login-eyebrow">ACCOUNT REVIEW</p>
              <h2>Approval pending</h2>
              <p>
                Your registration was successful. An administrator must
                approve your account before you can access account services.
              </p>
            </div>
            <button className="signin-button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  // DASHBOARD
  if (page === "dashboard") {
    const totalBalance = accounts.reduce(
      (total, account) => total + Number(account.balance || 0),
      0
    );

    return (
      <main className="vault-page" style={{ display: "block", minHeight: "100vh" }}>
        <section style={{ maxWidth: "1150px", margin: "0 auto", padding: "35px 24px" }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "35px",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "30px" }}>BalanceVault</h1>
              <p style={{ color: "#64748b", marginTop: "8px" }}>
                Welcome, {user?.name || "User"}
              </p>
            </div>
            <button className="signin-button" style={{ width: "auto", padding: "12px 22px" }} onClick={handleLogout}>
              Logout
            </button>
          </header>

          {dashboardError && (
            <p role="alert" style={{ color: "#b42318", background: "#fff1f0", padding: "12px", borderRadius: "8px" }}>
              {dashboardError}
            </p>
          )}

          {dashboardLoading ? (
            <p>Loading your dashboard...</p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                  marginBottom: "30px",
                }}
              >
                <div style={cardStyle}>
                  <p style={mutedStyle}>Total account balance</p>
                  <h2 style={{ marginBottom: 0 }}>{formatAmount(totalBalance)}</h2>
                  <small>Across your accounts</small>
                </div>

                <div style={cardStyle}>
                  <p style={mutedStyle}>My accounts</p>
                  <h2 style={{ marginBottom: 0 }}>{accounts.length}</h2>
                  <small>Active and available accounts</small>
                </div>

                <div style={cardStyle}>
                  <p style={mutedStyle}>Transactions</p>
                  <h2 style={{ marginBottom: 0 }}>{transactions.length}</h2>
                  <small>Retrieved transaction records</small>
                </div>
              </div>
{user?.role === "ADMIN" && (
  <section style={{ ...cardStyle, marginBottom: "25px" }}>
    <div style={sectionHeaderStyle}>
      <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
      <button onClick={loadAdminData} style={refreshButtonStyle}>
        Refresh Admin Data
      </button>
    </div>

    {adminMessage && (
      <p style={{
        color: adminMessageType === "error" ? "#b42318" : "#176b45",
        background: adminMessageType === "error" ? "#fff1f0" : "#edf8f1",
        padding: "12px",
        borderRadius: "8px",
      }}>
        {adminMessage}
      </p>
    )}

    {adminLoading ? (
      <p>Loading admin data...</p>
    ) : (
      <>
        <h3>Pending User Approvals ({pendingUsers.length})</h3>

        {pendingUsers.length === 0 ? (
          <p style={mutedStyle}>No pending approval requests.</p>
        ) : (
          pendingUsers.map((request) => (
            <div
              key={request.id}
              style={{
                padding: "15px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            >
              <strong>{request.user.name}</strong>
              <p style={mutedStyle}>
                {request.user.email} | {request.user.phone}
              </p>

              <button
                onClick={() =>
                  handleReviewUser(request.user.id, "APPROVED")
                }
                style={{
                  ...refreshButtonStyle,
                  background: "#176b45",
                  color: "white",
                  marginRight: "10px",
                }}
              >
                Approve
              </button>

              <button
                onClick={() =>
                  handleReviewUser(request.user.id, "REJECTED")
                }
                style={{
                  ...refreshButtonStyle,
                  background: "#b42318",
                  color: "white",
                }}
              >
                Reject
              </button>
            </div>
          ))
        )}

        <hr style={{ margin: "25px 0", borderColor: "#e5e7eb" }} />

        <h3>Add Demo Funds</h3>

        <form
          onSubmit={handleAddDemoFunds}
          style={{
            display: "grid",
            gap: "12px",
            maxWidth: "450px",
          }}
        >
          <input
            name="accountNumber"
            placeholder="Account number (BV...)"
            required
            style={transferInputStyle}
          />

          <input
            name="demoAmount"
            type="number"
            placeholder="Amount in INR"
            min="0.01"
            step="0.01"
            required
            style={transferInputStyle}
          />

          <input
            name="remarks"
            placeholder="Remarks (optional)"
            maxLength={200}
            style={transferInputStyle}
          />

          <button
            type="submit"
            className="signin-button"
            style={{ maxWidth: "220px" }}
          >
            Add Demo Funds
          </button>
        </form>

        <hr style={{ margin: "25px 0", borderColor: "#e5e7eb" }} />

        <h3>Recent Audit Logs</h3>

        {auditLogs.length === 0 ? (
          <p style={mutedStyle}>No audit logs available.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}>
              <thead>
                <tr>
                  {["Action", "Entity", "Admin", "Date"].map((heading) => (
                    <th key={heading} style={tableCellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={tableCellStyle}>{log.action}</td>
                    <td style={tableCellStyle}>{log.entity}</td>
                    <td style={tableCellStyle}>
                      {log.actor?.name || "System"}
                    </td>
                    <td style={tableCellStyle}>
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </section>
)}
              <section style={{ ...cardStyle, marginBottom: "25px" }}>
<div style={sectionHeaderStyle}>
  <h2 style={{ margin: 0 }}>My Accounts</h2>

  <div style={{ display: "flex", gap: "10px" }}>
    {accounts.length === 0 && (
      <button
        type="button"
        onClick={() => {
          setShowCreateAccount(!showCreateAccount);
          setAccountMessage("");
        }}
        style={{
          ...refreshButtonStyle,
          background: "#205746",
          color: "#ffffff",
          border: "none",
        }}
      >
        {showCreateAccount ? "Cancel" : "+ Create Account"}
      </button>
    )}

    <button
      type="button"
      onClick={loadDashboard}
      style={refreshButtonStyle}
    >
      Refresh
    </button>
  </div>
</div>
{accountMessage && (
  <p
    role="alert"
    style={{
      color: accountMessageType === "error" ? "#b42318" : "#176b45",
      background: accountMessageType === "error" ? "#fff1f0" : "#edf8f1",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "15px",
    }}
  >
    {accountMessage}
  </p>
)}

{showCreateAccount && (
  <form
    onSubmit={handleCreateAccount}
    style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "20px",
      marginBottom: "20px",
    }}
  >
    <h3 style={{ marginTop: 0 }}>Open a new account</h3>

    <p style={mutedStyle}>
      Create your INR demo account with a starting balance of ₹0.00.
    </p>

    <button
      type="submit"
      className="signin-button"
      disabled={accountCreating}
      style={{ marginTop: "18px", maxWidth: "220px" }}
    >
      {accountCreating ? "Creating..." : "Confirm Account Creation"}
    </button>
  </form>
)}

                {accounts.length === 0 ? (
                  <p style={mutedStyle}>
  No accounts found. Click "+ Create Account" to open your first account.
</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px" }}>
                    {accounts.map((account) => (
                      <div key={account.id} style={accountStyle}>
                        <p style={mutedStyle}>Account number</p>
                        <strong>{account.accountNumber}</strong>
                        <h2>{formatAmount(account.balance, account.currency)}</h2>
                        <span style={{ color: "#176b45", fontWeight: "600" }}>
                          {account.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
<section style={{ ...cardStyle, marginBottom: "25px" }}>
  <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
    Transfer Funds
  </h2>

  {transferMessage && (
    <p
      role="alert"
      style={{
        color: transferMessageType === "error" ? "#b42318" : "#176b45",
        background: transferMessageType === "error" ? "#fff1f0" : "#edf8f1",
        padding: "12px",
        borderRadius: "8px",
        marginBottom: "15px",
      }}
    >
      {transferMessage}
    </p>
  )}

  {accounts.filter((account) => account.status === "ACTIVE").length === 0 ? (
    <p style={mutedStyle}>Create an active account before making transfers.</p>
  ) : (
    <form
      onSubmit={handleTransfer}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
      }}
    >
      <div className="form-group">
        <label htmlFor="fromAccountNumber">From Account</label>
        <select
          id="fromAccountNumber"
          name="fromAccountNumber"
          required
          style={transferInputStyle}
        >
          {accounts
            .filter((account) => account.status === "ACTIVE")
            .map((account) => (
              <option key={account.id} value={account.accountNumber}>
                {account.accountNumber} — {formatAmount(account.balance)}
              </option>
            ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="toAccountNumber">Receiver Account Number</label>
        <input
          id="toAccountNumber"
          name="toAccountNumber"
          type="text"
          placeholder="Enter receiver BV account number"
          required
          style={transferInputStyle}
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount (INR)</label>
        <input
          id="amount"
          name="amount"
          type="number"
          placeholder="Enter amount"
          min="0.01"
          step="0.01"
          required
          style={transferInputStyle}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="Optional transfer description"
          maxLength={200}
          style={transferInputStyle}
        />
      </div>

      <button
        type="submit"
        className="signin-button"
        disabled={transferLoading}
        style={{ gridColumn: "1 / -1", maxWidth: "240px" }}
      >
        {transferLoading ? "Processing..." : "Transfer Funds →"}
      </button>
    </form>
  )}
</section>
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Recent Transactions</h2>

                {transactions.length === 0 ? (
                  <p style={mutedStyle}>No transactions available yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr>
                          {["Transaction", "Amount", "Status", "Date"].map((heading) => (
                            <th key={heading} style={tableCellStyle}>{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td style={tableCellStyle}>
                              {transaction.description || transaction.type || transaction.id}
                            </td>
                            <td style={tableCellStyle}>
                              {formatAmount(transaction.amount, transaction.currency || "INR")}
                            </td>
                            <td style={tableCellStyle}>{transaction.status || "—"}</td>
                            <td style={tableCellStyle}>
                              {transaction.createdAt
                                ? new Date(transaction.createdAt).toLocaleDateString("en-IN")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    );
  }

  // LOGIN AND REGISTRATION
  return (
    <main className="vault-page">
      <section className="brand-panel">
        <header className="brand-header">
          <div className="brand-logo"><span>b</span></div>
          <span className="brand-name">balancevault</span>
          <div className="secure-status">
            <span className="status-dot"></span>
            Secure ledger platform
          </div>
        </header>

        <div className="hero-content">
          <p className="hero-eyebrow">
            {isRegister ? "A BETTER WAY TO BEGIN." : "Money, accounted for."}
          </p>
          <h1>
            {isRegister ? (
              <>Your finances,<br /><em>your foundation.</em></>
            ) : (
              <>Confidence in every<br /><em>transaction.</em></>
            )}
          </h1>
          <p className="hero-description">
            {isRegister
              ? "Create your account and experience clear, secure and accountable account management."
              : "A clearer view of your accounts, built on a ledger where every entry has its place."}
          </p>

          <div className="ledger-visual">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="ledger-card">
              <div className="ledger-top">BV / PRIVATE LEDGER<span className="ledger-dot"></span></div>
              <div className="ledger-lines"><span></span><span></span><span></span></div>
              <div className="ledger-bottom"><span>SECURE BY DESIGN</span><span className="shield">◇</span></div>
            </div>
            <div className="floating-tag verified"><span>01</span> Verified access</div>
            <div className="floating-tag accountable"><span>✓</span> Every entry accountable</div>
          </div>
        </div>

        <footer className="brand-footer">
          <span>Private by design</span>
          <span>Built around financial integrity</span>
        </footer>
      </section>

      <section className="login-panel">
        <div className="login-content">
          <div className="login-heading">
            <p className="login-eyebrow">{isRegister ? "GET STARTED" : "WELCOME BACK"}</p>
            <h2>{isRegister ? "Create your vault" : "Sign in to your vault"}</h2>
            <p>
              {isRegister
                ? "Set up your account in a few simple steps."
                : "Your accounts, clearly in view."}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" type="text" placeholder="Enter your full name" required minLength={2} />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="phone">Phone number</label>
                <input id="phone" name="phone" type="tel" placeholder="Enter your phone number" pattern="[0-9]{10}" required />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" minLength={8} required />
                <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "◎"}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="password-wrapper">
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" minLength={8} required />
                  <button type="button" className="eye-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "Hide" : "◎"}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <p role="alert" style={{
                color: messageType === "error" ? "#b42318" : "#176b45",
                background: messageType === "error" ? "#fff1f0" : "#edf8f1",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                lineHeight: "1.5",
              }}>
                {message}
              </p>
            )}

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="signup-text">
            {isRegister ? "Already have an account?" : "New to BalanceVault?"}
            <button type="button" onClick={changePage}>
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>

          <div className="login-security">
            <span className="lock-icon">♧</span>
            <p>Your connection is protected. Your account credentials are handled securely.</p>
          </div>
        </div>

        <footer className="login-footer">BalanceVault · Secure financial ledger</footer>
      </section>
    </main>
  );
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 4px 15px rgba(15, 23, 42, 0.04)",
};

const accountStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "18px",
};

const mutedStyle = { color: "#64748b", fontSize: "14px" };
const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "18px",
};
const refreshButtonStyle = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  padding: "8px 14px",
  borderRadius: "7px",
  cursor: "pointer",
};
const tableCellStyle = {
  padding: "13px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
};
const transferInputStyle = {
  width: "100%",
  height: "45px",
  padding: "10px",
  border: "1px solid #dce4dd",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#173c30",
  fontSize: "13px",
};
export default App;
