
import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [page, setPage] = useState(() => {
  const token = sessionStorage.getItem("balancevaultToken");

  try {
    const savedUser = JSON.parse(
      sessionStorage.getItem("balancevaultUser") || "null"
    );

    if (!token) return "login";
    return savedUser?.status === "PENDING" ? "pending" : "dashboard";
  } catch {
    return "login";
  }
});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [statementTransactions, setStatementTransactions] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementMessage, setStatementMessage] = useState("");
  const [statementMessageType, setStatementMessageType] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [userSection, setUserSection] = useState("overview");
  const [dashboardError, setDashboardError] = useState("");
const [showCreateAccount, setShowCreateAccount] = useState(false);
const [accountCreating, setAccountCreating] = useState(false);
const [accountMessage, setAccountMessage] = useState("");
const [accountMessageType, setAccountMessageType] = useState("");
const [transferLoading, setTransferLoading] = useState(false);
const [transferMessage, setTransferMessage] = useState("");
const [transferMessageType, setTransferMessageType] = useState("");
const [withdrawalLoading, setWithdrawalLoading] = useState(false);
const [withdrawalMessage, setWithdrawalMessage] = useState("");
const [withdrawalMessageType, setWithdrawalMessageType] = useState("");
const [pendingUsers, setPendingUsers] = useState([]);
const [auditLogs, setAuditLogs] = useState([]);
const [adminLoading, setAdminLoading] = useState(false);
const [adminMessage, setAdminMessage] = useState("");
const [adminMessageType, setAdminMessageType] = useState("");  
const [adminSection, setAdminSection] = useState("overview");
const [depositRequests, setDepositRequests] = useState([]);
const [depositLoading, setDepositLoading] = useState(false);
const [depositMessage, setDepositMessage] = useState("");
const [depositMessageType, setDepositMessageType] = useState("");
const [adminDepositRequests, setAdminDepositRequests] = useState([]);
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

    const responseText = await response.text();

let data = {};

try {
  data = responseText ? JSON.parse(responseText) : {};
} catch {
  data = {};
}

if (!response.ok) {
  throw new Error(
    data.message || `Account creation failed. Server returned ${response.status}.`
  );
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

    setTransferMessage(
  data.message || `Transaction Successful! ${formatAmount(amount)} has been transferred successfully.`
);
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
const handleWithdrawal = async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const formData = new FormData(form);
  const accountNumber = String(formData.get("accountNumber") || "").trim();
  const amount = String(formData.get("withdrawalAmount") || "").trim();
  const description = String(formData.get("withdrawalDescription") || "").trim();

  if (!accountNumber || !amount || Number(amount) <= 0) {
    setWithdrawalMessage("Select an account and enter an amount greater than zero.");
    setWithdrawalMessageType("error");
    return;
  }

  const selectedAccount = accounts.find(
    (account) => account.accountNumber === accountNumber
  );

  if (selectedAccount && Number(amount) > Number(selectedAccount.balance || 0)) {
    setWithdrawalMessage("Insufficient balance in the selected account.");
    setWithdrawalMessageType("error");
    return;
  }

  try {
    setWithdrawalLoading(true);
    setWithdrawalMessage("");
    const token = sessionStorage.getItem("balancevaultToken");

    const response = await fetch(`${API_URL}/api/transactions/withdraw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountNumber, amount, description }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Withdrawal failed.");
    }

    setWithdrawalMessage(
      data.message || `Withdrawal of ${formatAmount(amount)} completed successfully.`
    );
    setWithdrawalMessageType("success");
    form.reset();
    await loadDashboard();
  } catch (error) {
    setWithdrawalMessage(error.message || "Unable to complete withdrawal.");
    setWithdrawalMessageType("error");
  } finally {
    setWithdrawalLoading(false);
  }
};

const loadMyDepositRequests = useCallback(async () => {
  const token = sessionStorage.getItem("balancevaultToken");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/deposits/my-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to load deposit requests.");
    }
    setDepositRequests(data.requests || data.depositRequests || []);
  } catch (error) {
    setDepositMessage(error.message || "Unable to load deposit history.");
    setDepositMessageType("error");
  }
}, []);

const handleDepositRequest = async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const formData = new FormData(form);
  const accountNumber = String(formData.get("depositAccountNumber") || "").trim();
  const amount = String(formData.get("depositAmount") || "").trim();
  const description = String(formData.get("depositDescription") || "").trim();

  if (!accountNumber || !amount || Number(amount) <= 0) {
    setDepositMessage("Select an account and enter an amount greater than zero.");
    setDepositMessageType("error");
    return;
  }

  try {
    setDepositLoading(true);
    setDepositMessage("");
    const token = sessionStorage.getItem("balancevaultToken");
    const response = await fetch(`${API_URL}/api/deposits/request`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountNumber, amount, description }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to submit deposit request.");
    }

    setDepositMessage(data.message || "Deposit request submitted successfully.");
    setDepositMessageType("success");
    form.reset();
    await Promise.all([loadMyDepositRequests(), loadDashboard()]);
  } catch (error) {
    setDepositMessage(error.message || "Unable to submit deposit request.");
    setDepositMessageType("error");
  } finally {
    setDepositLoading(false);
  }
};

const loadAdminData = useCallback(async () => {
  const token = sessionStorage.getItem("balancevaultToken");

  try {
    setAdminLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    const [usersResponse, logsResponse, depositsResponse] = await Promise.all([
      fetch(`${API_URL}/api/admin/pending-users`, { headers }),
      fetch(`${API_URL}/api/admin/audit-logs`, { headers }),
      fetch(`${API_URL}/api/admin/deposit-requests`, { headers }),
    ]);

    const usersData = await usersResponse.json();
    const logsData = await logsResponse.json();
    const depositsData = await depositsResponse.json();

    if (!usersResponse.ok) {
      throw new Error(usersData.message || "Unable to load pending users.");
    }

    if (!logsResponse.ok) {
      throw new Error(logsData.message || "Unable to load audit logs.");
    }
    if (!depositsResponse.ok) {
      throw new Error(depositsData.message || "Unable to load deposit requests.");
    }

    setPendingUsers(usersData.requests || []);
    setAuditLogs(logsData.logs || []);
    setAdminDepositRequests(depositsData.requests || depositsData.depositRequests || []);
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

const handleReviewDeposit = async (requestId, status) => {
  const remarks = window.prompt(
    status === "APPROVED" ? "Optional approval remarks:" : "Reason for rejection (optional):"
  ) || "";
  const token = sessionStorage.getItem("balancevaultToken");

  try {
    setAdminMessage("");
    const response = await fetch(
      `${API_URL}/api/admin/deposit-requests/${requestId}/review`,
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
      throw new Error(data.message || "Unable to review deposit request.");
    }

    setAdminMessage(data.message || `Deposit request ${status.toLowerCase()}.`);
    setAdminMessageType("success");
    await loadAdminData();
  } catch (error) {
    setAdminMessage(error.message || "Unable to review deposit request.");
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
  } catch (error) {
    setAdminMessage(error.message);
    setAdminMessageType("error");
  }
};
useEffect(() => {
  if (page === "dashboard") {
    if (user?.role === "ADMIN") {
      loadAdminData();
    } else {
      loadDashboard();
      loadMyDepositRequests();
    }
  }
}, [page, user, loadDashboard, loadAdminData, loadMyDepositRequests]);

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

      setUserSection("overview");
setAdminSection("overview");

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

  const loadStatement = async () => {
    if (statementStartDate && statementEndDate && statementStartDate > statementEndDate) {
      setStatementMessage("End date must not be before start date.");
      setStatementMessageType("error");
      return;
    }

    const token = sessionStorage.getItem("balancevaultToken");
    setStatementLoading(true);
    setStatementMessage("");
    setStatementTransactions([]);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statementStartDate) params.set("startDate", statementStartDate);
      if (statementEndDate) params.set("endDate", statementEndDate);

      const headers = { Authorization: `Bearer ${token}` };
      let pageNumber = 1;
      let allTransactions = [];
      let totalPages = 1;

      do {
        params.set("page", String(pageNumber));
        const response = await fetch(
          `${API_URL}/api/transactions/my-transactions?${params.toString()}`,
          { headers }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to generate statement.");
        allTransactions = allTransactions.concat(data.transactions || []);
        totalPages = data.pagination?.totalPages || 0;
        pageNumber += 1;
      } while (pageNumber <= totalPages);

      setStatementTransactions(allTransactions);
      setStatementMessage(
        allTransactions.length
          ? `${allTransactions.length} transaction(s) found for the selected period.`
          : "No transactions found for the selected period."
      );
      setStatementMessageType("success");
    } catch (error) {
      setStatementMessage(error.message || "Unable to generate statement.");
      setStatementMessageType("error");
    } finally {
      setStatementLoading(false);
    }
  };

  const downloadStatementCSV = () => {
    if (!statementTransactions.length) return;

    const accountIds = new Set(accounts.map((account) => account.id));
    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [[
      "Date", "Reference", "Description", "Direction", "Amount", "Currency",
      "Own Account", "Counterparty Account (last 4)", "Status",
    ]];

    statementTransactions.forEach((transaction) => {
      const ownEntry = (transaction.ledgerEntries || []).find((entry) => accountIds.has(entry.accountId));
      const ownAccount = accounts.find((account) => account.id === ownEntry?.accountId);
      const direction = getTransactionDirection(transaction);
      const isDebit = direction === "DEBIT";
      const rawAmount = Number(ownEntry?.amount ?? transaction.amount ?? 0);
      const signedAmount = direction === "CREDIT" ? rawAmount : direction === "DEBIT" ? -rawAmount : rawAmount;
      const counterparty = isDebit
        ? transaction.toAccount?.accountNumber
        : transaction.fromAccount?.accountNumber;

      rows.push([
        transaction.createdAt ? new Date(transaction.createdAt).toLocaleString("en-IN") : "",
        transaction.reference || "",
        transaction.description || "",
        direction,
        signedAmount,
        transaction.currency || "INR",
        ownAccount?.accountNumber || "",
        counterparty ? `****${String(counterparty).slice(-4)}` : "",
        transaction.status || "",
      ]);
    });

    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BalanceVault-Statement-${statementStartDate || "all"}-to-${statementEndDate || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Fill the login form with configured demo credentials.
// Fill login email based on selected role
const fillDemoCredentials = (role) => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (role === "admin") {
    emailInput.value = "lavanya.demo@example.com";
    passwordInput.value = "";
    passwordInput.focus();

    setMessage("Admin email filled. Enter your admin password and click Sign in.");
    setMessageType("success");
  } else {
    emailInput.value = "";
    passwordInput.value = "";

    emailInput.focus();

    setMessage("Enter your registered USER email and password, then click Sign in.");
    setMessageType("success");
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
    setStatementTransactions([]);
    setStatementMessage("");
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

  // Direction is based on this user's ledger entry, not only transaction type.
  const getTransactionDirection = (transaction) => {
    if (transaction.direction) return transaction.direction;

    const ownEntries = (transaction.ledgerEntries || []).filter((entry) =>
      accounts.some((account) => account.id === entry.accountId)
    );

    const hasDebit = ownEntries.some((entry) => entry.entryType === "DEBIT");
    const hasCredit = ownEntries.some((entry) => entry.entryType === "CREDIT");

    if (hasDebit && hasCredit) return "INTERNAL";
    if (hasDebit) return "DEBIT";
    if (hasCredit) return "CREDIT";

    if (transaction.type === "WITHDRAWAL") return "DEBIT";
    if (transaction.type === "DEPOSIT") return "CREDIT";
    if (transaction.fromAccountId && accounts.some((account) => account.id === transaction.fromAccountId)) return "DEBIT";
    if (transaction.toAccountId && accounts.some((account) => account.id === transaction.toAccountId)) return "CREDIT";

    return "—";
  };

  const directionStyle = (direction) => ({
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    color: direction === "CREDIT" ? "#176b45" : direction === "DEBIT" ? "#b42318" : "#475569",
    background: direction === "CREDIT" ? "#eaf7ef" : direction === "DEBIT" ? "#fff0ef" : "#eef2f7",
  });

  const formatSignedTransactionAmount = (amount, direction, currency = "INR") => {
    const sign = direction === "CREDIT" ? "+" : direction === "DEBIT" ? "−" : "";
    return `${sign}${formatAmount(amount, currency)}`;
  };

  // ADMIN DASHBOARD
if (page === "dashboard" && user?.role === "ADMIN") {
  const adminMenu = [
    { id: "overview", icon: "▦", label: "Overview" },
    { id: "approvals", icon: "✓", label: "Pending Approvals" },
    { id: "deposits", icon: "＋", label: "Deposit Requests" },
    { id: "funds", icon: "₹", label: "Demo Funds" },
    { id: "logs", icon: "▤", label: "Audit Logs" },
    { id: "profile", icon: "♙", label: "My Profile" },
  ];

  const adminTitles = {
    overview: "Admin Overview",
    approvals: "Pending Approvals",
    deposits: "Deposit Requests",
    funds: "Demo Funds Management",
    logs: "Audit Logs",
    profile: "My Profile",
  };

  return (
    <main className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">b</div>
          <div>
            <h2>BalanceVault</h2>
            <p>ADMIN CONSOLE</p>
          </div>
        </div>

        <p className="admin-nav-title">WORKSPACE</p>

        <nav className="admin-nav">
          {adminMenu.map((item) => (
            <button
              key={item.id}
              type="button"
              className={adminSection === item.id ? "active" : ""}
              onClick={() => setAdminSection(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
              {item.id === "approvals" && pendingUsers.length > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "#e5edda",
                  color: "#153f33",
                  borderRadius: "20px",
                  padding: "3px 7px",
                  fontSize: "9px",
                  fontWeight: "bold",
                }}>
                  {pendingUsers.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <span className="admin-nav-icon">↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{adminTitles[adminSection]}</h1>
            <p>Manage and monitor your BalanceVault demo platform.</p>
          </div>

          <div className="admin-user-info">
            <div className="admin-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {adminMessage && (
          <div
            className={`admin-message ${
              adminMessageType === "error" ? "error" : ""
            }`}
            role="alert"
          >
            {adminMessage}
          </div>
        )}

        {adminLoading && (
          <p style={{ color: "#71877b", fontSize: "12px" }}>
            Loading admin data...
          </p>
        )}

        {/* OVERVIEW */}
        {adminSection === "overview" && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Pending Approvals</span>
                <strong className="admin-stat-value">
                  {pendingUsers.length}
                </strong>
                <span className="admin-stat-note">
                  Requests awaiting review
                </span>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Audit Records</span>
                <strong className="admin-stat-value">
                  {auditLogs.length}
                </strong>
                <span className="admin-stat-note">
                  Retrieved audit records
                </span>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Admin Accounts</span>
                <strong className="admin-stat-value">
                  {accounts.length}
                </strong>
                <span className="admin-stat-note">
                  Accounts linked to this admin login
                </span>
              </div>

              <div className="admin-stat-card">
                <span className="admin-stat-label">Transactions</span>
                <strong className="admin-stat-value">
                  {transactions.length}
                </strong>
                <span className="admin-stat-note">
                  Transactions linked to this admin login
                </span>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Pending User Requests</h2>
                  <p>Review new account registrations.</p>
                </div>

                <button
                  type="button"
                  className="admin-action-button secondary"
                  onClick={loadAdminData}
                  disabled={adminLoading}
                >
                  Refresh Data
                </button>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="admin-empty">
                  No pending approval requests.
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((request) => (
                        <tr key={request.id}>
                          <td>{request.user?.name || "—"}</td>
                          <td>{request.user?.email || "—"}</td>
                          <td>{request.user?.phone || "—"}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-action-button"
                              onClick={() =>
                                setAdminSection("approvals")
                              }
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-panel" style={{ marginTop: "20px" }}>
              <div className="admin-panel-header">
                <div>
                  <h2>Recent Audit Activity</h2>
                  <p>Latest available system audit records.</p>
                </div>

                <button
                  type="button"
                  className="admin-action-button secondary"
                  onClick={() => setAdminSection("logs")}
                >
                  View All
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="admin-empty">No audit records available.</div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Actor</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 5).map((log) => (
                        <tr key={log.id}>
                          <td>{log.action}</td>
                          <td>{log.entity}</td>
                          <td>{log.actor?.name || "System"}</td>
                          <td>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString("en-IN")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* PENDING APPROVALS */}
        {adminSection === "approvals" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Registration Requests</h2>
                <p>Approve or reject users waiting for account access.</p>
              </div>

              <button
                type="button"
                className="admin-action-button secondary"
                onClick={loadAdminData}
                disabled={adminLoading}
              >
                Refresh
              </button>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="admin-empty">
                No pending users to review.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((request) => (
                      <tr key={request.id}>
                        <td>{request.user?.name || "—"}</td>
                        <td>{request.user?.email || "—"}</td>
                        <td>{request.user?.phone || "—"}</td>
                        <td>
                          <span className="admin-status">PENDING</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "7px" }}>
                            <button
                              type="button"
                              className="admin-action-button"
                              onClick={() =>
                                handleReviewUser(request.user.id, "APPROVED")
                              }
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="admin-action-button danger"
                              onClick={() =>
                                handleReviewUser(request.user.id, "REJECTED")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEPOSIT REQUESTS */}
        {adminSection === "deposits" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Deposit Requests</h2>
                <p>Review user deposit requests. Approving a request credits the selected account.</p>
              </div>
              <button
                type="button"
                className="admin-action-button secondary"
                onClick={loadAdminData}
                disabled={adminLoading}
              >
                Refresh
              </button>
            </div>

            {adminDepositRequests.length === 0 ? (
              <div className="admin-empty">No deposit requests found.</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Requested</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminDepositRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          {request.user?.name || "—"}
                          <br />
                          <small>{request.user?.email || ""}</small>
                        </td>
                        <td>{request.account?.accountNumber || request.accountId || "—"}</td>
                        <td>{formatAmount(request.amount, request.account?.currency || "INR")}</td>
                        <td>{request.createdAt ? new Date(request.createdAt).toLocaleString("en-IN") : "—"}</td>
                        <td>
                          <span className="admin-status">{request.status || "PENDING"}</span>
                        </td>
                        <td>
                          {request.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                className="admin-action-button"
                                onClick={() => handleReviewDeposit(request.id, "APPROVED")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="admin-action-button danger"
                                onClick={() => handleReviewDeposit(request.id, "REJECTED")}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#64748b" }}>Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DEMO FUNDS */}
        {adminSection === "funds" && (
          <div className="admin-panel" style={{ maxWidth: "650px" }}>
            <div className="admin-panel-header">
              <div>
                <h2>Add Demo Funds</h2>
                <p>
                  Credit demo funds to an existing account for testing.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDemoFunds} className="admin-form">
              <label htmlFor="adminAccountNumber">Account Number</label>
              <input
                id="adminAccountNumber"
                name="accountNumber"
                placeholder="Enter account number (BV...)"
                required
              />

              <label htmlFor="adminDemoAmount">Amount (INR)</label>
              <input
                id="adminDemoAmount"
                name="demoAmount"
                type="number"
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                required
              />

              <label htmlFor="adminRemarks">Remarks</label>
              <textarea
                id="adminRemarks"
                name="remarks"
                placeholder="Reason for adding demo funds"
                maxLength={200}
                rows={3}
              />

              <button type="submit" className="admin-action-button">
                Add Demo Funds
              </button>
            </form>

            <p style={{
              color: "#87948c",
              fontSize: "10px",
              lineHeight: 1.6,
              marginTop: "18px",
            }}>
              This feature adds simulated funds for demonstration and testing.
              It does not transfer real money.
            </p>
          </div>
        )}

        {/* AUDIT LOGS */}
        {adminSection === "logs" && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>System Audit Logs</h2>
                <p>Review recorded administrative and system activities.</p>
              </div>

              <button
                type="button"
                className="admin-action-button secondary"
                onClick={loadAdminData}
                disabled={adminLoading}
              >
                Refresh
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="admin-empty">No audit logs available.</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Entity ID</th>
                      <th>Actor</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.action || "—"}</td>
                        <td>{log.entity || "—"}</td>
                        <td>{log.entityId || "—"}</td>
                        <td>{log.actor?.name || "System"}</td>
                        <td>
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString("en-IN")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {adminSection === "profile" && (
          <div className="admin-panel" style={{ maxWidth: "650px" }}>
            <div className="admin-panel-header">
              <div>
                <h2>Administrator Profile</h2>
                <p>Your current account information.</p>
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px 0",
              borderBottom: "1px solid #edf1ec",
            }}>
              <div className="admin-avatar" style={{
                width: "55px",
                height: "55px",
                fontSize: "20px",
              }}>
                {(user?.name || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px" }}>
                  {user?.name || "Administrator"}
                </h2>
                <p style={{ color: "#87948c", fontSize: "11px" }}>
                  BalanceVault Administrator
                </p>
              </div>
            </div>

            <div style={{ paddingTop: "15px", lineHeight: 2.2 }}>
              <p><strong>Name:</strong> {user?.name || "—"}</p>
              <p><strong>Email:</strong> {user?.email || "—"}</p>
              <p><strong>Phone:</strong> {user?.phone || "—"}</p>
              <p><strong>Role:</strong> {user?.role || "—"}</p>
              <p><strong>Account Status:</strong> {user?.status || "—"}</p>
            </div>

            <p style={{ color: "#87948c", fontSize: "10px" }}>
              Profile editing is not available through the current backend API.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

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
      <main className="user-layout">
        <aside className="user-sidebar">
          <div className="user-brand">BalanceVault</div>
          <p className="user-nav-title">MAIN MENU</p>
          <nav className="user-nav" aria-label="User dashboard navigation">
            <button type="button" className={userSection === "overview" ? "active" : ""} onClick={() => setUserSection("overview")}>◈ Overview</button>
            <button type="button" className={userSection === "accounts" ? "active" : ""} onClick={() => setUserSection("accounts")}>▣ My Accounts</button>
            <button type="button" className={userSection === "transfer" ? "active" : ""} onClick={() => setUserSection("transfer")}>⇄ Transfer Funds</button>
            <button type="button" className={userSection === "withdraw" ? "active" : ""} onClick={() => { setUserSection("withdraw"); setWithdrawalMessage(""); }}>↘ Withdraw Money</button>
            <button type="button" className={userSection === "deposit" ? "active" : ""} onClick={() => setUserSection("deposit")}>＋ Deposit</button>
            <button type="button" className={userSection === "statement" ? "active" : ""} onClick={() => setUserSection("statement")}>▤ Account Statement</button>
            <button type="button" className={userSection === "transactions" ? "active" : ""} onClick={() => setUserSection("transactions")}>◷ Transactions</button>
          </nav>
          <div className="user-sidebar-bottom">
            <button type="button" className="user-logout" onClick={handleLogout}>↪ Logout</button>
          </div>
        </aside>

        <section className="user-main">
          <div className="user-content">
            <header className="user-topbar">
              <div>
                <h1>{{ overview: "Overview", accounts: "My Accounts", transfer: "Transfer Funds", withdraw: "Withdraw Money", deposit: "Deposit Funds", statement: "Account Statement", transactions: "Transactions" }[userSection]}</h1>
                <p style={{ color: "#64748b", marginTop: "8px" }}>Welcome, {user?.name || "User"}</p>
              </div>
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
              {userSection === "overview" && (
              <div
                id="user-overview"
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
              )}

              {(userSection === "overview" || userSection === "accounts") && (
<section id="user-accounts" style={{ ...cardStyle, marginBottom: "25px" }}>
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
              )}

              {userSection === "transfer" && (
<section id="user-transfer" style={{ ...cardStyle, marginBottom: "25px" }}>
  <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
    Transfer Funds
  </h2>

  
{transferMessage && (
  <div
    role="alert"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "16px",
      borderRadius: "10px",
      marginBottom: "20px",
      background: transferMessageType === "success" ? "#eaf8ef" : "#fff1f0",
      border: `1px solid ${transferMessageType === "success" ? "#a5dfb8" : "#f5b5b0"}`,
      color: transferMessageType === "success" ? "#176b45" : "#b42318",
    }}
  >
    <span style={{ fontSize: "25px" }}>
      {transferMessageType === "success" ? "✓" : "⚠"}
    </span>

    <div>
      <strong style={{ display: "block", marginBottom: "4px" }}>
        {transferMessageType === "success"
          ? "Transaction Successful!"
          : "Transaction Failed"}
      </strong>
      <span style={{ fontSize: "13px" }}>
        {transferMessage}
      </span>
    </div>
  </div>
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
              )}

              {userSection === "withdraw" && (
                <section id="user-withdraw" style={{ ...cardStyle, maxWidth: "760px" }}>
                  <h2 style={{ marginTop: 0 }}>Withdraw Money</h2>
                  <p style={mutedStyle}>Withdraw funds instantly from one of your active BalanceVault accounts.</p>

                  {withdrawalMessage && (
                    <div role="alert" style={{
                      padding: "13px 15px",
                      borderRadius: "9px",
                      marginBottom: "18px",
                      background: withdrawalMessageType === "success" ? "#eaf8ef" : "#fff1f0",
                      border: `1px solid ${withdrawalMessageType === "success" ? "#a5dfb8" : "#f5b5b0"}`,
                      color: withdrawalMessageType === "success" ? "#176b45" : "#b42318",
                    }}>
                      {withdrawalMessage}
                    </div>
                  )}

                  {accounts.filter((account) => account.status === "ACTIVE").length === 0 ? (
                    <p style={mutedStyle}>You need an active account before making a withdrawal.</p>
                  ) : (
                    <form onSubmit={handleWithdrawal} style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                    }}>
                      <div className="form-group">
                        <label htmlFor="withdrawAccountNumber">Select Account</label>
                        <select id="withdrawAccountNumber" name="accountNumber" required style={transferInputStyle}>
                          {accounts.filter((account) => account.status === "ACTIVE").map((account) => (
                            <option key={account.id} value={account.accountNumber}>
                              {account.accountNumber} — Available: {formatAmount(account.balance, account.currency)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="withdrawalAmount">Amount (INR)</label>
                        <input
                          id="withdrawalAmount"
                          name="withdrawalAmount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Enter withdrawal amount"
                          required
                          style={transferInputStyle}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label htmlFor="withdrawalDescription">Description</label>
                        <input
                          id="withdrawalDescription"
                          name="withdrawalDescription"
                          type="text"
                          maxLength={200}
                          placeholder="e.g. Personal withdrawal"
                          style={transferInputStyle}
                        />
                      </div>

                      <div style={{
                        gridColumn: "1 / -1",
                        background: "#f0f7f3",
                        border: "1px solid #d7e9dd",
                        borderRadius: "9px",
                        padding: "13px 15px",
                        color: "#205746",
                        fontSize: "13px",
                      }}>
                        <strong>Instant withdrawal</strong>
                        <div style={{ marginTop: "4px" }}>Your balance will be updated after the server validates your account and available funds.</div>
                      </div>

                      <button type="submit" className="signin-button" disabled={withdrawalLoading} style={{ gridColumn: "1 / -1", maxWidth: "240px" }}>
                        {withdrawalLoading ? "Processing..." : "Withdraw Money →"}
                      </button>
                    </form>
                  )}
                </section>
              )}

              {userSection === "deposit" && (
                <div style={{ display: "grid", gap: "22px" }}>
                  <section id="user-deposit" style={{ ...cardStyle, maxWidth: "760px" }}>
                    <h2 style={{ marginTop: 0 }}>Request a Deposit</h2>
                    <p style={mutedStyle}>
                      Submit a deposit request for admin review. Your account balance changes only after approval.
                    </p>

                    {depositMessage && (
                      <div role="alert" style={{
                        padding: "13px 15px",
                        borderRadius: "9px",
                        marginBottom: "18px",
                        background: depositMessageType === "success" ? "#eaf8ef" : "#fff1f0",
                        border: `1px solid ${depositMessageType === "success" ? "#a5dfb8" : "#f5b5b0"}`,
                        color: depositMessageType === "success" ? "#176b45" : "#b42318",
                      }}>
                        {depositMessage}
                      </div>
                    )}

                    {accounts.filter((account) => account.status === "ACTIVE").length === 0 ? (
                      <p style={mutedStyle}>You need an active account before requesting a deposit.</p>
                    ) : (
                      <form onSubmit={handleDepositRequest} style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                      }}>
                        <div className="form-group">
                          <label htmlFor="depositAccountNumber">Select Account</label>
                          <select
                            id="depositAccountNumber"
                            name="depositAccountNumber"
                            required
                            style={transferInputStyle}
                          >
                            {accounts.filter((account) => account.status === "ACTIVE").map((account) => (
                              <option key={account.id} value={account.accountNumber}>
                                {account.accountNumber} — Balance: {formatAmount(account.balance, account.currency)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="depositAmount">Amount (INR)</label>
                          <input
                            id="depositAmount"
                            name="depositAmount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter deposit amount"
                            required
                            style={transferInputStyle}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                          <label htmlFor="depositDescription">Description</label>
                          <input
                            id="depositDescription"
                            name="depositDescription"
                            type="text"
                            maxLength={200}
                            placeholder="e.g. Monthly savings"
                            style={transferInputStyle}
                          />
                        </div>

                        <div style={{
                          gridColumn: "1 / -1",
                          background: "#fff8e8",
                          border: "1px solid #f1dfb5",
                          color: "#805b16",
                          borderRadius: "9px",
                          padding: "13px 15px",
                          fontSize: "13px",
                        }}>
                          <strong>Admin approval required</strong>
                          <div style={{ marginTop: "4px" }}>
                            This request will remain pending until an administrator reviews it. No money is added when you submit it.
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="signin-button"
                          disabled={depositLoading}
                          style={{ gridColumn: "1 / -1", maxWidth: "260px" }}
                        >
                          {depositLoading ? "Submitting..." : "Submit Deposit Request →"}
                        </button>
                      </form>
                    )}
                  </section>

                  <section style={cardStyle}>
                    <div style={sectionHeaderStyle}>
                      <div>
                        <h2 style={{ margin: 0 }}>My Deposit Requests</h2>
                        <p style={mutedStyle}>Track the approval status of your requests.</p>
                      </div>
                      <button
                        type="button"
                        style={refreshButtonStyle}
                        onClick={loadMyDepositRequests}
                        disabled={depositLoading}
                      >
                        Refresh
                      </button>
                    </div>

                    {depositRequests.length === 0 ? (
                      <p style={mutedStyle}>No deposit requests found yet.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr>
                              {["Account", "Amount", "Status", "Requested On", "Remarks"].map((heading) => (
                                <th key={heading} style={tableCellStyle}>{heading}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {depositRequests.map((request) => (
                              <tr key={request.id}>
                                <td style={tableCellStyle}>{request.account?.accountNumber || request.accountId || "—"}</td>
                                <td style={tableCellStyle}>{formatAmount(request.amount, request.account?.currency || "INR")}</td>
                                <td style={tableCellStyle}>
                                  <span style={{
                                    display: "inline-block",
                                    padding: "5px 9px",
                                    borderRadius: "20px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: request.status === "APPROVED" ? "#176b45" : request.status === "REJECTED" ? "#b42318" : "#805b16",
                                    background: request.status === "APPROVED" ? "#eaf8ef" : request.status === "REJECTED" ? "#fff1f0" : "#fff8e8",
                                  }}>
                                    {request.status || "PENDING"}
                                  </span>
                                </td>
                                <td style={tableCellStyle}>{request.createdAt ? new Date(request.createdAt).toLocaleString("en-IN") : "—"}</td>
                                <td style={tableCellStyle}>{request.remarks || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {(userSection === "overview" || userSection === "statement") && (
              <section id="user-statement" style={{ ...cardStyle, marginBottom: "25px" }}>
                <div style={sectionHeaderStyle}>
                  <h2 style={{ margin: 0 }}>Account Statement</h2>
                  <button
                    type="button"
                    onClick={downloadStatementCSV}
                    disabled={!statementTransactions.length || statementLoading}
                    style={{ ...refreshButtonStyle, opacity: statementTransactions.length ? 1 : 0.5, cursor: statementTransactions.length ? "pointer" : "not-allowed" }}
                  >
                    Download CSV
                  </button>
                </div>
                <p style={mutedStyle}>
                  Choose a date range to view and download all matching account transactions. Leave both dates empty to include all transactions.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", alignItems: "end" }}>
                  <div className="form-group">
                    <label htmlFor="statementStartDate">From date</label>
                    <input id="statementStartDate" type="date" value={statementStartDate} onChange={(e) => setStatementStartDate(e.target.value)} style={transferInputStyle} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="statementEndDate">To date</label>
                    <input id="statementEndDate" type="date" value={statementEndDate} onChange={(e) => setStatementEndDate(e.target.value)} style={transferInputStyle} />
                  </div>
                  <button type="button" className="signin-button" onClick={loadStatement} disabled={statementLoading} style={{ maxWidth: "220px", marginBottom: "0" }}>
                    {statementLoading ? "Loading statement..." : "Generate Statement"}
                  </button>
                </div>
                {statementMessage && (
                  <p role="status" style={{ color: statementMessageType === "error" ? "#b42318" : "#176b45", background: statementMessageType === "error" ? "#fff1f0" : "#edf8f1", padding: "11px", borderRadius: "8px", marginTop: "16px" }}>
                    {statementMessage}
                  </p>
                )}
                {statementTransactions.length > 0 && (() => {
                  const ownAccountIds = new Set(accounts.map((account) => account.id));
                  const totals = statementTransactions.reduce((sum, transaction) => {
                    (transaction.ledgerEntries || []).forEach((entry) => {
                      if (!ownAccountIds.has(entry.accountId)) return;
                      const amount = Number(entry.amount || 0);
                      if (entry.entryType === "DEBIT") sum.debit += amount;
                      if (entry.entryType === "CREDIT") sum.credit += amount;
                    });
                    return sum;
                  }, { debit: 0, credit: 0 });
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "18px" }}>
                      <div style={{ background: "#fff5f5", borderRadius: "10px", padding: "15px" }}>
                        <small style={mutedStyle}>Total debits</small>
                        <h3 style={{ margin: "7px 0 0", color: "#b42318" }}>{formatAmount(totals.debit)}</h3>
                      </div>
                      <div style={{ background: "#effaf3", borderRadius: "10px", padding: "15px" }}>
                        <small style={mutedStyle}>Total credits</small>
                        <h3 style={{ margin: "7px 0 0", color: "#176b45" }}>{formatAmount(totals.credit)}</h3>
                      </div>
                      <div style={{ background: "#f1f5f9", borderRadius: "10px", padding: "15px" }}>
                        <small style={mutedStyle}>Transactions</small>
                        <h3 style={{ margin: "7px 0 0" }}>{statementTransactions.length}</h3>
                      </div>
                    </div>
                  );
                })()}
                {statementTransactions.length > 0 && (
                  <div style={{ overflowX: "auto", marginTop: "18px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead><tr>{["Date", "Reference", "Direction", "Amount", "Status"].map((heading) => <th key={heading} style={tableCellStyle}>{heading}</th>)}</tr></thead>
                      <tbody>
                        {statementTransactions.map((transaction) => {
                          const ownEntry = (transaction.ledgerEntries || []).find((entry) => accounts.some((account) => account.id === entry.accountId));
                          const direction = getTransactionDirection(transaction);
                          return (
                            <tr key={transaction.id}>
                              <td style={tableCellStyle}>{new Date(transaction.createdAt).toLocaleDateString("en-IN")}</td>
                              <td style={tableCellStyle}>{transaction.reference || "—"}</td>
                              <td style={tableCellStyle}><span style={directionStyle(direction)}>{direction}</span></td>
                              <td style={{ ...tableCellStyle, color: direction === "DEBIT" ? "#b42318" : direction === "CREDIT" ? "#176b45" : "#334155", fontWeight: 700 }}>{formatSignedTransactionAmount(ownEntry?.amount ?? transaction.amount, direction, transaction.currency || "INR")}</td>
                              <td style={tableCellStyle}>{transaction.status || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              )}

              {userSection === "transactions" && (
              <section id="user-transactions" style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Recent Transactions</h2>

                {transactions.length === 0 ? (
                  <p style={mutedStyle}>No transactions available yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr>
                          {["Transaction", "Direction", "Amount", "Status", "Date"].map((heading) => (
                            <th key={heading} style={tableCellStyle}>{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => {
                          const ownEntry = (transaction.ledgerEntries || []).find((entry) =>
                            accounts.some((account) => account.id === entry.accountId)
                          );
                          const direction = getTransactionDirection(transaction);
                          return (
                            <tr key={transaction.id}>
                              <td style={tableCellStyle}>
                                {transaction.description || transaction.type || transaction.id}
                              </td>
                              <td style={tableCellStyle}>
                                <span style={directionStyle(direction)}>{direction}</span>
                              </td>
                              <td style={{ ...tableCellStyle, color: direction === "DEBIT" ? "#b42318" : direction === "CREDIT" ? "#176b45" : "#334155", fontWeight: 700 }}>
                                {formatSignedTransactionAmount(ownEntry?.amount ?? transaction.amount, direction, transaction.currency || "INR")}
                              </td>
                              <td style={tableCellStyle}>{transaction.status || "—"}</td>
                              <td style={tableCellStyle}>
                                {transaction.createdAt
                                  ? new Date(transaction.createdAt).toLocaleDateString("en-IN")
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              )}
            </>
          )}
          </div>
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

          {!isRegister && (
            <div className="demo-login-section">
              <p className="demo-login-title">QUICK DEMO ACCESS</p>
              <p className="demo-login-description">Choose a demo role to fill the sign-in form.</p>
              <div className="demo-login-options">
                <button
                  type="button"
                  className="demo-login-button"
                  onClick={() => fillDemoCredentials("user")}
                >
                  <span className="demo-role-name">User Login</span>
                  <span className="demo-role-hint">Fill user credentials →</span>
                </button>
                <button
                  type="button"
                  className="demo-login-button"
                  onClick={() => fillDemoCredentials("admin")}
                >
                  <span className="demo-role-name">Admin Login</span>
                  <span className="demo-role-hint">Use admin email →</span>
                </button>
              </div>
            </div>
          )}

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
