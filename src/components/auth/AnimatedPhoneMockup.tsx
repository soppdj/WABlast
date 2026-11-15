import { useState, useEffect } from 'react';
import { CheckCheck, Send, ShieldCheck, Heart, Sparkles, Smartphone } from 'lucide-react';

export default function AnimatedPhoneMockup() {
  const [activeStep, setActiveStep] = useState(0);

  // Cycle through animation stages to demonstrate broadcast & reply flow
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[340px]">
      {/* Decorative Glow Behind Phone */}
      <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-r from-emerald-500/20 via-teal-400/20 to-emerald-600/20 blur-xl" />

      {/* Floating Feature Pills */}
      <div className="absolute -top-3 -left-4 z-20 hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/95 px-3 py-1 shadow-md text-[11px] font-semibold text-emerald-800 animate-bounce duration-1000">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        <span>Kunci Segmen Otomatis</span>
      </div>

      <div className="absolute -bottom-3 -right-3 z-20 hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/95 px-3 py-1 shadow-md text-[11px] font-semibold text-emerald-800">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Jeda Acak Anti-Blokir</span>
      </div>

      {/* Outer Phone Hardware Mockup */}
      <div className="relative overflow-hidden rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl">
        {/* Dynamic Island / Top Speaker */}
        <div className="absolute top-2 left-1/2 z-30 h-4 w-24 -translate-x-1/2 rounded-full bg-black/80 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-slate-800 mr-2" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-700" />
        </div>

        {/* Screen Container */}
        <div className="flex h-[520px] flex-col bg-[#ECE5DD] pt-7">
          {/* WhatsApp Header Bar */}
          <div className="bg-[#075E54] px-3 py-2.5 text-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">
                  YR
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#075E54] bg-emerald-400" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold tracking-tight">Yayasan Khoirur Rooziqiin</p>
                <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • Sedekah Subuh
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-200">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Chat Messages Area */}
          <div
            className="flex-1 space-y-3 overflow-y-auto p-3"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Date Pill */}
            <div className="flex justify-center">
              <span className="rounded-md bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-xs">
                HARI INI (SUBUH)
              </span>
            </div>

            {/* Bubble 1: Outgoing Broadcast (Ayah Ahmad Fauzi) */}
            <div className={`transition-all duration-500 ${activeStep >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-2.5 text-xs text-slate-800 shadow-xs">
                <p className="font-semibold text-emerald-900 text-[11px] flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                  Sapaan Sedekah Subuh
                </p>
                <p className="mt-1 leading-relaxed">
                  Assalamu'alaikum <strong>Ayah Ahmad Fauzi</strong>,
                </p>
                <p className="mt-1 leading-relaxed text-[11px] text-slate-700">
                  Semoga keberkahan melimpah hari ini. Mari awali subuh dengan sedekah terbaik untuk para santri & dhuafa.
                </p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-500">
                  <span>04:30 WIB</span>
                  <CheckCheck className="h-3.5 w-3.5 text-sky-600" />
                </div>
              </div>
            </div>

            {/* Bubble 2: Outgoing Broadcast (Bunda Siti Aminah) */}
            <div className={`transition-all duration-500 ${activeStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-2.5 text-xs text-slate-800 shadow-xs">
                <p className="leading-relaxed">
                  Assalamu'alaikum <strong>Bunda Siti Aminah</strong>, doa terbaik kami panjatkan untuk keluarga tercinta... 🤲
                </p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-500">
                  <span>04:30 WIB (+15s)</span>
                  <CheckCheck className="h-3.5 w-3.5 text-sky-600" />
                </div>
              </div>
            </div>

            {/* Bubble 3: Incoming Donor Reply */}
            <div className={`transition-all duration-500 ${activeStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="mr-auto max-w-[82%] rounded-2xl rounded-tl-xs bg-white p-2.5 text-xs text-slate-800 shadow-xs border border-slate-100">
                <p className="text-[10px] font-bold text-emerald-800">Ayah Ahmad Fauzi</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  Alhamdulillah, sudah saya transfer untuk sedekah subuh pagi ini ya Ustadz. Aamiin 🤲
                </p>
                <div className="mt-1 flex items-center justify-end text-[9px] text-slate-400">
                  <span>04:32 WIB</span>
                </div>
              </div>
            </div>

            {/* Bubble 4: System Auto-Forward Alert */}
            <div className={`transition-all duration-500 ${activeStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="mx-auto rounded-xl border border-emerald-300 bg-emerald-50/95 p-2 text-[10px] text-emerald-900 shadow-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <Send className="h-3 w-3 text-emerald-600" />
                  <span>Auto-Forward CS Utama Berhasil</span>
                </div>
                <p className="mt-0.5 text-emerald-800">
                  Pesan Ayah Ahmad langsung masuk ke WhatsApp CS Utama (1 nomor terpusat).
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp Bottom Input Bar Mockup */}
          <div className="bg-white px-3 py-2 border-t border-slate-200 flex items-center gap-2">
            <div className="flex-1 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{activeStep === 2 ? 'Ayah Ahmad sedang mengetik...' : 'Ketik pesan balasan...'}</span>
              <span className="text-slate-300">📎</span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#075E54] text-white">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="h-4 bg-slate-900 flex items-center justify-center">
          <div className="h-1 w-20 rounded-full bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
