import { Check } from 'lucide-react';

interface WhatsAppPreviewProps {
  message: string;
}

export default function WhatsAppPreview({ message }: WhatsAppPreviewProps) {
  const displayMessage = message.trim() || 'Ketik pesan di editor untuk melihat preview...';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* WhatsApp Header */}
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
          AF
        </div>
        <div>
          <p className="text-white text-sm font-medium">Ayah Ahmad Fauzi</p>
          <p className="text-green-200 text-xs">online</p>
        </div>
      </div>

      {/* Chat Background */}
      <div
        className="flex-1 p-4 overflow-y-auto"
        style={{
          backgroundColor: '#ECE5DD',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Outgoing message bubble */}
        <div className="flex justify-end">
          <div className="relative max-w-[85%]">
            {/* Bubble tail */}
            <div
              className="absolute -right-1.5 top-0 w-3 h-3"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                backgroundColor: '#DCF8C6',
              }}
            />
            {/* Bubble */}
            <div
              className="rounded-lg px-3 py-2 shadow-sm"
              style={{ backgroundColor: '#DCF8C6' }}
            >
              <p className="text-[14px] text-gray-900 whitespace-pre-wrap leading-relaxed">
                {displayMessage}
              </p>
              {/* Time + double check */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[11px] text-gray-500">{timeStr}</span>
                <div className="flex -space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-400">
          Ketik pesan
        </div>
        <div className="w-10 h-10 rounded-full bg-[#075E54] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
