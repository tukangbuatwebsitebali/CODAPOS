# CODAPOS Tablet - Flutter POS App

Aplikasi Point of Sale (POS) untuk tablet Android & iOS yang terhubung ke backend CODAPOS.

## ✨ Fitur

- 🔐 **Login** — Autentikasi ke backend CODAPOS
- 📦 **Katalog Produk** — Grid produk dengan filter kategori & pencarian
- 🛒 **Keranjang** — Tambah/kurang item, perhitungan otomatis PPN 11%
- 💳 **Pembayaran** — Tunai (dengan kembalian), QRIS, Transfer
- 📊 **Riwayat Transaksi** — Daftar transaksi dengan detail item
- 🌙 **Dark Mode** — Desain gelap premium dengan identitas CODAPOS (#1DA1F2)

## 🚀 Setup & Build

### Prerequisites
- Flutter SDK 3.6+ ([Install Flutter](https://docs.flutter.dev/get-started/install))
- Android Studio (untuk Android) / Xcode (untuk iOS)

### 1. Generate Platform Files
```bash
cd flutter_pos
flutter create --org com.codapos --platforms android,ios .
```

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Configure Backend URL
Edit `lib/services/api_service.dart`:
```dart
// Untuk Android Emulator:
static const String baseUrl = 'http://10.0.2.2:8080/api';

// Untuk iOS Simulator:
static const String baseUrl = 'http://localhost:8080/api';

// Untuk Device Asli (ganti dengan IP komputer):
static const String baseUrl = 'http://192.168.x.x:8080/api';
```

### 4. Run
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Chrome (untuk testing)
flutter run -d chrome
```

### 5. Build APK / IPA
```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle

# iOS
flutter build ios --release
```

## 📁 Struktur Proyek

```
flutter_pos/
├── lib/
│   ├── main.dart                    # Entry point, theme, auth gate
│   ├── providers/
│   │   ├── auth_provider.dart       # Login state + token management
│   │   └── cart_provider.dart       # Cart state + PPN calculation
│   ├── screens/
│   │   ├── login_screen.dart        # Login UI (landscape/portrait)
│   │   ├── pos_screen.dart          # Main POS (products + cart + payment)
│   │   └── transaction_history_screen.dart  # Transaction list
│   └── services/
│       └── api_service.dart         # HTTP client for CODAPOS backend
├── pubspec.yaml
└── README.md
```

## 📱 Supported Platforms
- Android 5.0+ (API 21+)
- iOS 12.0+
- Optimized for tablet landscape mode
