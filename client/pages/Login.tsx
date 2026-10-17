import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldAlert, ConciergeBell } from "lucide-react";
import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"receptionist" | "admin">("receptionist");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const switchTab = (r: "receptionist" | "admin") => {
        setRole(r);
        setErrorMsg("");
        if (r === 'admin') {
            setEmail("admin@karikalam.com");
            setPassword("admin123");
        } else if (r === 'receptionist') {
            setEmail("reception@karikalam.com");
            setPassword("reception123");
        }
    };

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoggingIn(true);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem("auth_token", data.token);
                localStorage.setItem("auth_role", data.role);
                // Redirect based on role
                if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'receptionist') navigate('/reception');
                else navigate('/');
            } else {
                setErrorMsg(data.error || "Authentication failed. Try again.");
            }
        } catch (err) {
            setErrorMsg("Network error trying to connect to Server API.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <main className="auth-page section-pad" style={{ minHeight: "65vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="auth-card" style={{ width: "100%", maxWidth: 460, background: "white", padding: "40px", borderRadius: 12, border: "1px solid var(--border)", boxShadow: "0 6px 30px rgba(0,0,0,0.03)" }}>
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, background: "var(--ivory)", borderRadius: "50%", color: "var(--maroon)", marginBottom: 15 }}>
                        {role === 'receptionist' && <ConciergeBell size={24} />}
                        {role === 'admin' && <ShieldAlert size={24} />}
                    </div>
                    <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, lineHeight: 1.2, marginBottom: 8, color: "var(--ink)" }}>
                        {role === 'receptionist' ? 'Receptionist access' : 'Admin portal'}
                    </h1>
                    <p style={{ color: "var(--muted-ink)", fontSize: 14 }}>Enter your credentials to continue securely.</p>
                </div>

                <div style={{ display: "flex", gap: "10px", marginBottom: "30px", background: "var(--ivory)", padding: "5px", borderRadius: "8px" }}>
                    <button type="button" onClick={() => switchTab("receptionist")} style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, borderRadius: "6px", background: role === "receptionist" ? "var(--maroon)" : "transparent", color: role === "receptionist" ? "white" : "var(--muted-ink)", border: "none", cursor: "pointer" }}>Reception</button>
                    <button type="button" onClick={() => switchTab("admin")} style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, borderRadius: "6px", background: role === "admin" ? "var(--maroon)" : "transparent", color: role === "admin" ? "white" : "var(--muted-ink)", border: "none", cursor: "pointer" }}>Admin</button>
                </div>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="customer-field">
                        <label htmlFor="login-email" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Employee ID / Email</span>
                            <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>DEMO CREDENTIALS LOADED</span>
                        </label>
                        <input id="login-email" type="text" placeholder="Enter standard ID" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="customer-field">
                        <label htmlFor="login-pass">Password / PIN</label>
                        <input id="login-pass" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {errorMsg && <div style={{ background: "#ffebee", color: "var(--maroon)", padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>{errorMsg}</div>}
                    <button type="submit" disabled={isLoggingIn} className={`button button-maroon ${isLoggingIn ? 'button-disabled' : ''}`} style={{ width: "100%", marginTop: "10px" }}>
                        {isLoggingIn ? "Verifying..." : "Secure Login"} <ArrowRight size={16} />
                    </button>
                </form>
            </div>
        </main>
    );
}
