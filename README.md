# 🛡️ CyberVault

![CyberVault Banner](https://raw.githubusercontent.com/atharvashete15/CyberVault/main/public/banner.png)

> **Secure, Private, and Encrypted File Sharing.**
> CyberVault is a state-of-the-art end-to-end encrypted (E2EE) file exchange system designed for maximum privacy and security.

---

## ✨ Key Features

- **🔐 True Zero-Knowledge Architecture**: Files are encrypted directly in your browser using **AES-256-GCM**. Your plaintext data and passphrases never leave your device.
- **🛡️ Secure File DNA**: Advanced integrity verification using SHA-256 hashing to ensure files haven't been tampered with.
- **⏳ Time-Limited Sharing**: Set expiration dates (1h to 30d) and maximum download limits for complete control over your shared data.
- **⚡ Supercharged Performance**: Lightning-fast encryption and decryption powered by the native Web Crypto API.
- **📱 Responsive & Elegant UI**: A premium, modern interface built with React and Tailwind CSS, featuring glassmorphism and smooth micro-interactions.
- **☁️ Supabase Powered Backend**: Robust infrastructure with real-time updates and strict Row-Level Security (RLS).

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/atharvashete15/CyberVault.git
   cd cybervault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 🛠️ Technology Stack

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/)
- **Encryption**: Web Crypto API (AES-256-GCM, PBKDF2)
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 📜 Documentation

For more detailed information, please refer to the following guides:

| Guide | Description |
| :--- | :--- |
| [🚀 Quick Start](file:///D:/Codelancer_Project/cybervault/SECURE_FILE_EXCHANGE_QUICKSTART.md) | Get up and running in 5 minutes. |
| [📂 Storage Setup](file:///D:/Codelancer_Project/cybervault/SUPABASE_STORAGE_SETUP.md) | How to configure Supabase buckets and RLS. |
| [🔐 Security Architecture](file:///D:/Codelancer_Project/cybervault/IMPLEMENTATION_SUMMARY.md) | Deep dive into the encryption implementation. |
| [🔌 Integration Guide](file:///D:/Codelancer_Project/cybervault/INTEGRATION_EXAMPLE.md) | How to integrate CyberVault into other projects. |
| [📋 Deployment Checklist](file:///D:/Codelancer_Project/cybervault/DEPLOYMENT_CHECKLIST.md) | Steps to take before going live. |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the CyberVault Team
</p>
