
import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = page === "register";

  return (
    <main className="vault-page">

      {/* LEFT PANEL */}
      <section className="brand-panel">

        <header className="brand-header">
          <div className="brand-logo">
            <span>b</span>
          </div>

          <span className="brand-name">balancevault</span>

          <div className="secure-status">
            <span className="status-dot"></span>
            Secure ledger platform
          </div>
        </header>

        <div className="hero-content">

          <p className="hero-eyebrow">
            {isRegister
              ? "A BETTER WAY TO BEGIN."
              : "Money, accounted for."}
          </p>

          <h1>
            {isRegister ? (
              <>
                Your finances,
                <br />
                <em>your foundation.</em>
              </>
            ) : (
              <>
                Confidence in every
                <br />
                <em>transaction.</em>
              </>
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
              <div className="ledger-top">
                BV / PRIVATE LEDGER
                <span className="ledger-dot"></span>
              </div>

              <div className="ledger-lines">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="ledger-bottom">
                <span>SECURE BY DESIGN</span>
                <span className="shield">◇</span>
              </div>
            </div>

            <div className="floating-tag verified">
              <span>01</span> Verified access
            </div>

            <div className="floating-tag accountable">
              <span>✓</span> Every entry accountable
            </div>

          </div>
        </div>

        <footer className="brand-footer">
          <span>Private by design</span>
          <span>Built around financial integrity</span>
        </footer>

      </section>

      {/* RIGHT PANEL */}
      <section className="login-panel">

        <div className="login-content">

          <div className="login-heading">

            <p className="login-eyebrow">
              {isRegister ? "GET STARTED" : "WELCOME BACK"}
            </p>

            <h2>
              {isRegister
                ? "Create your vault"
                : "Sign in to your vault"}
            </h2>

            <p>
              {isRegister
                ? "Set up your account in a few simple steps."
                : "Your accounts, clearly in view."}
            </p>

          </div>

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.currentTarget;

              if (isRegister) {
                const password =
                  form.elements.password.value;

                const confirmPassword =
                  form.elements.confirmPassword.value;

                if (password !== confirmPassword) {
                  alert("Passwords do not match!");
                  return;
                }

                alert("Registration form validated! Backend connection is coming next.");
              } else {
                alert("Login backend connection is coming next.");
              }
            }}
          >

            {isRegister && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    minLength={2}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="phone">Phone number</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "◎"}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword ? "Hide" : "◎"}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="signin-button">
              {isRegister ? "Create account" : "Sign in"}
              <span>→</span>
            </button>

          </form>

          <p className="signup-text">
            {isRegister
              ? "Already have an account?"
              : "New to BalanceVault?"}

            <button
              type="button"
              onClick={() => {
                setPage(isRegister ? "login" : "register");
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
            >
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>

          <div className="login-security">
            <span className="lock-icon">♧</span>

            <p>
              Your connection is protected. Your account
              credentials are handled securely.
            </p>
          </div>

        </div>

        <footer className="login-footer">
          BalanceVault · Secure financial ledger
        </footer>

      </section>

    </main>
  );
}

export default App;
