const makeWASocket = require("baileys").default;
const { useMultiFileAuthState } = require("baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);

    // ✅ QR Login
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log("📌 Scan QR di atas pakai WhatsApp Anda!");
        }
        if (connection === "close") {
            const shouldReconnect = 
                lastDisconnect?.error?.output?.statusCode !== 401;
            console.log("❌ Koneksi terputus...");
            if (shouldReconnect) {
                console.log("🔁 Mencoba koneksi ulang...");
                start();
            } else {
                console.log("⚠️ Sesi invalid, scan ulang QR.");
            }
        } else if (connection === "open") {
            console.log("✅ Bot berhasil login!");
        }
    });

    // ✅ Auto Respon
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();

        if (text.includes("pesan")) {
            // kirim teks + gambar QRIS
            const qrisPath = path.resolve("./qris.png"); // pastikan file qris.png ada di folder yang sama

            await sock.sendMessage(from, {
                image: fs.readFileSync(qrisPath),
                caption: `Halo Juragan/Nona 👋, terima kasih sudah melakukan pemesanan di *Nisa Server* 🙏

Silakan lakukan pembayaran melalui *QRIS* berikut (semua e-wallet & bank bisa):

📲 *QRIS All Payment*  
🧾 Nominal sesuai invoice yang dikirim sistem.

Jika sudah transfer, kirim bukti pembayaran agar pesanan segera diproses 🙏

Terima kasih atas kepercayaannya 💖`
            });
        }
    });
}

start();
