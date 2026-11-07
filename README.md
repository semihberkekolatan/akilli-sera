# 🌱 Akıllı Sera Otomasyon ve Takip Uygulaması

> **TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı** kapsamında desteklenmeye hak kazanmış ve başarıyla tamamlanmış projedir.

Seradaki çevresel koşulları ve toprak değerlerini sensörler aracılığıyla anlık olarak ölçen, eşik değerlere göre sulama ve iklimlendirme sistemlerini otomatik yöneten ve kullanıcıyı mobil/web arayüz üzerinden bilgilendiren akıllı sera uygulamasıdır.

## ✨ Temel Özellikler

- 💧 **Otomatik Sulama:** Toprak nem sensöründen gelen verileri izleyerek nem oranı belirlenen eşiğin altına düştüğünde sulama sistemini otomatik devreye alır.
- 🧪 **Azot (N) Ölçümü ve Gübreleme Bildirimi:** Topraktaki azot miktarını takip eder; gübreleme zamanı geldiğinde uygulama üzerinden uyarı ve bildirim gönderir.
- 🌡️ **Sıcaklık Takibi ve Otomatik Fan Kontrolü:** Sıcaklık sensörleri sera içi sıcaklığın ideal aralığın dışına çıktığını tespit ettiğinde fanı çalıştırarak serayı otomatik soğutur.
- 🪴 **Bitki Modları:** Domates, salatalık gibi farklı ürünler için özelleştirilmiş hedef değer profilleri ve manuel kontrol modu sunar.
- 📊 **Canlı Grafik ve Geçmiş Takibi:** Sıcaklık, nem, ışık, toprak nemi ve azot verilerini grafiksel olarak görselleştirir; aktüatörlerin (sulama, fan, ısıtıcı, aydınlatma, gübreleme) uzaktan kontrol edilmesini sağlar.

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Arayüz | React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion |
| Veri Görselleştirme | Recharts |
| Gerçek Zamanlı Veri & Bulut | Firebase (Firestore) |
| Derleme Aracı | Vite |
| Donanım / Saha | Arduino Mega, Toprak Nemi, Azot (NPK), Sıcaklık & Nem, Işık Sensörleri; Röle, Su Pompası ve Soğutma Fanı |

## 🚀 Yerel Ortamda Çalıştırma

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Uygulamayı geliştirme modunda başlatın
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

## 👤 Geliştirici

**Semih Berke Kolatan** — Kapadokya Üniversitesi, Bilişim Sistemleri ve Teknolojileri  
[GitHub](https://github.com/semihberkekolatan) · [LinkedIn](https://www.linkedin.com/in/semihberkekolatan)
