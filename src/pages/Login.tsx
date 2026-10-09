import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "../lib/auth";
import { BookOpen, Lock, Mail, User, Sparkles, ArrowRight } from "lucide-react";

export function Login() {
  const [, setLocation] = useLocation();
  const { login, register, guestLogin } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await guestLogin();
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Guest login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-card border shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl mx-auto bg-gradient-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center font-bold shadow-md">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-foreground">
          {mode === "login" ? "Sign In to SSC Vocab" : "Create Aspirant Account"}
        </h1>
        <p className="text-xs text-muted-foreground">
          Track individual progress, revision schedules, and MCQ scores.
        </p>
      </div>

      {/* Guest Mode Direct Access */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center space-y-2">
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
          🚀 Instant Preview & Testing Mode
        </span>
        <button
          type="button"
          onClick={handleGuest}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
        >
          Explore with Demo Aspirant Profile
        </button>
      </div>

      <div className="flex border-b text-xs font-bold text-center">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 pb-2.5 transition-colors ${
            mode === "login" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={`flex-1 pb-2.5 transition-colors ${
            mode === "register" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          New Registration
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Processing..." : mode === "login" ? "Sign In" : "Register Account"}
        </button>
      </form>
    </div>
  );
}
