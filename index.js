const makeWASocket = require("baileys").default;
const { useMultiFileAuthState } = require("baileys");
const qrcode = require("qrcode-terminal");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on("creds.update", saveCreds);

    // ✅ QR Code
sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("📌 Scan QR di atas pakai WhatsApp Anda!");
    }

    if (connection === "close") {
        const shouldReconnect = 
            lastDisconnect?.error?.output?.statusCode !== 401; // jangan reconnect kalau logout
        console.log("❌ Koneksi terputus...");
        if (shouldReconnect) {
            console.log("🔁 Mencoba koneksi ulang...");
            start();
        } else {
            console.log("⚠️ Tidak reconnect karena sesi invalid (harus scan ulang).");
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
             await sock.sendMessage(from, { 
                text: `Halo Juragan/Nona 👋, terima kasih sudah melakukan pemesanan di situs *Nisa Server* 🙏.

Pesanan kamu sudah tercatat di Database kami.
Silakan lakukan pembayaran terlebih dahulu melalui salah satu metode berikut:

💳 *Metode Pembayaran:*  
- DANA: Close  a.n. [x]
- SeaBank: 901925356893 a.n. [Hanif Almuzaki] 

Mohon bayar sesuai jumlah yang di tentukan, jika kurang maka transaksi anda di anggap tidak valid!!!
Setelah transfer, mohon kirim bukti pembayaran agar pesanan segera diproses.
Biasanya admin memberikan tanda sedang aktif di whatsapp dengan memberikan Reaction Love pada pemesanan anda dalam 1–5 menit.
Jika lebih dari 6 jam, baru komplain...🙏.

Terima kasih atas kepercayaannya 🙏.`
            });
        }
    });
}

start();
