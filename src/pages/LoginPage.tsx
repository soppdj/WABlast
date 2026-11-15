import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Loader2,
  AlertTriangle,
  Lock,
  User,
  Eye,
  EyeOff,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isDemo } from '../lib/supabase';

const DEMO_EMAIL = 'admin@wablast.demo';
const DEMO_PASS = 'demo1234';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState(isDemo ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(isDemo ? DEMO_PASS : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(usernameOrEmail.trim(), password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login gagal. Periksa kembali username dan kata sandi Anda.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFillDemo() {
    setUsernameOrEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError('');
  }

  return (
    <div className="h-screen max-h-screen w-full bg-[#F8FAFC] flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar — Samakan dengan Desain Dashboard */}
      <header className="w-full border-b border-slate-200 bg-white px-6 py-3.5 shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#0F172A] block leading-tight">
                WABlast <span className="text-emerald-600">Pro</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 block">
                Yayasan Khoirur Rooziqiin Bandung
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Multi-Device Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area — Single Screen Without Scroll */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* LEFT COLUMN: WELCOMING SECTION (Sesuai Permintaan User) */}
            <div className="space-y-5 text-center lg:col-span-7 lg:text-left">
              {/* Badge Sambutan */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>WELCOME TO WABLAST</span>
              </div>

              {/* Header Lembaga dengan Font Lebih Besar dan Pemenggalan Baris yang Tepat */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[46px] font-black tracking-tight text-[#0F172A] leading-tight">
                  <span className="block">YAYASAN KHOIRUR ROOZIQIIN</span>
                  <span className="block text-emerald-800">BANDUNG</span>
                </h1>
                {/* Slogan / Tagline Cetak Miring dengan Titik di Akhir */}
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold italic text-emerald-700">
                  &ldquo;Menebar kebaikan dalam satu klikan.&rdquo;
                </p>
              </div>

              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600 lg:mx-0">
                Aplikasi otomasi broadcast WhatsApp cerdas dan terintegrasi untuk menyapa para donatur tercinta, laporan penyaluran infaq/wakaf, serta pengingat rutin <strong>Sedekah Subuh</strong> dengan routing nomor terkunci dan jeda anti-blokir.
              </p>
            </div>

            {/* RIGHT COLUMN: LOGIN UI CARD (Samakan dengan Desain Dashboard) */}
            <div className="lg:col-span-5">
              <div className="mx-auto w-full max-w-md">
                {/* Demo Mode Notice Banner */}
                {isDemo && (
                  <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="font-bold">Mode Demo Aktif</p>
                        <p className="text-[11px] text-amber-700">Gunakan akun demo untuk masuk</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillDemo}
                      className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
                    >
                      Isi Demo
                    </button>
                  </div>
                )}

                {/* Login Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="mb-5 space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Autentikasi Pengelola</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
                      Masuk ke Sistem
                    </h2>
                    <p className="text-xs text-slate-500">
                      Masukkan username dan password admin Anda.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Username Field */}
                    <div>
                      <label
                        htmlFor="username"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Username:
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <User className="h-4 w-4" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          value={usernameOrEmail}
                          onChange={(e) => setUsernameOrEmail(e.target.value)}
                          required
                          autoComplete="username"
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                          placeholder="admin@wablast.demo"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Password:
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="w-full rounded-xl border border-slate-300 pl-9 pr-9 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error Box */}
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    {/* Submit Button — Samakan dengan Tombol Hijau Dashboard */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <span>Masuk ke Sistem</span>
                      )}
                    </button>
                  </form>

                  {/* Demo Helper */}
                  {isDemo && (
                    <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                      <p className="text-[11px] text-slate-500">
                        Akun Demo: <strong className="text-slate-700">admin@wablast.demo</strong> •{' '}
                        <strong className="text-slate-700">demo1234</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER SESUAI PERMINTAAN USER */}
      <footer className="w-full border-t border-slate-200 bg-white py-3 text-center shrink-0">
        <p className="text-xs font-medium text-slate-500">
          WABlast Yayasan Khoirur Rooziqiin . Powered by FateherLab . 2026
        </p>
      </footer>
    </div>
  );
}
