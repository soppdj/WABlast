# Folder Binary Engine GOWA (WhatsApp Multi-Device Gateway)

Folder ini digunakan untuk meletakkan binary `gowa.exe` pada sistem operasi Windows.

## Cara Mengisi Binary:
1. **Otomatis:** Jalankan file `jalankan-gowa.bat` di root proyek. Script akan otomatis mengunduh dan mengekstrak `gowa.exe` dari release resmi GitHub.
2. **Manual:** Unduh binary rilis resmi Windows 64-bit dari [aldinokemal/go-whatsapp-web-multidevice Releases](https://github.com/aldinokemal/go-whatsapp-web-multidevice/releases) dan tempatkan `gowa.exe` di dalam folder ini.

*Catatan Keamanan: File binary executable (`.exe`) dan database session WhatsApp (`storages/`) secara otomatis dikecualikan oleh `.gitignore` demi menjaga keamanan token dan sesi akun WhatsApp Anda.*
