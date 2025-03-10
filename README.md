# AI-UI: Yapay Zeka Destekli UI Bileşen Platformu

AI-UI, yapay zeka destekli bir UI bileşen oluşturma ve paylaşma platformudur. Kullanıcılar, doğal dil kullanarak UI bileşenleri oluşturabilir, düzenleyebilir ve toplulukla paylaşabilirler.

## 🚀 Özellikler

- **Yapay Zeka ile Kod Üretimi**: Google'ın Gemini AI teknolojisini kullanarak doğal dil açıklamalarından React bileşenleri oluşturma
- **Bileşen Keşfi**: Topluluk tarafından oluşturulan bileşenleri keşfetme ve filtreleme
- **Kişisel Dashboard**: Oluşturduğunuz bileşenleri yönetme ve izleme
- **Sosyal Etkileşim**: Bileşenleri beğenme ve paylaşma
- **Çoklu Teknoloji Desteği**: React, Tailwind CSS ve TypeScript desteği
- **Karanlık/Aydınlık Mod**: Kullanıcı tercihine göre tema desteği
- **Duyarlı Tasarım**: Tüm cihazlarda mükemmel görünüm

## 🛠️ Teknolojiler

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma
- **Veritabanı**: MySql
- **Kimlik Doğrulama**: NextAuth.js (GitHub ve Google OAuth)
- **Yapay Zeka**: Google Gemini AI API

## 📋 Kurulum

### Ön Koşullar

- Node.js 18.0 veya üzeri
- MySql veritabanı
- Google Gemini API anahtarı (isteğe bağlı)

### Adımlar

1. Repoyu klonlayın:

   ```bash
   git clone https://github.com/yourusername/ai-ui.git
   cd ai-ui
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. `.env.local` dosyasını oluşturun:

   ```
   # Veritabanı
   DATABASE_URL="postgresql://username:password@localhost:5432/ai-ui"

   # Kimlik Doğrulama
   AUTH_SECRET="your-auth-secret"
   AUTH_GITHUB_ID="your-github-client-id"
   AUTH_GITHUB_SECRET="your-github-client-secret"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"

   # Gemini API
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. Veritabanı şemasını oluşturun:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Geliştirme sunucusunu başlatın:

   ```bash
   npm run dev
   ```

6. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 🧩 Kullanım

1. **Bileşen Oluşturma**:

   - "Oluştur" sayfasına gidin
   - Yapay zeka prompt'unu yazın (örn. "Hover durumunda büyüyen, gradient arka plana sahip bir buton bileşeni oluştur")
   - "Gemini ile Kod Üret" butonuna tıklayın
   - Oluşturulan kodu düzenleyin ve kaydedin

2. **Bileşen Keşfetme**:

   - "Keşfet" sayfasına gidin
   - Arama, teknoloji filtresi ve sıralama seçeneklerini kullanarak bileşenleri bulun
   - Bileşenleri görüntüleyin, beğenin ve kendi projelerinizde kullanın

3. **Dashboard**:
   - Oluşturduğunuz bileşenleri görüntüleyin
   - Bileşenlerin durumunu değiştirin (taslak, yayınlandı, arşivlendi)
   - İstatistikleri takip edin (görüntülenme, beğeni)

## 📝 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://prisma.io)
- [NextAuth.js](https://next-auth.js.org)
- [Google Gemini AI](https://ai.google.dev)
