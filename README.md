# Visol — To‘yga marhamat

Feruzbek Mirjavxarov tayyorlagan aniq bir to‘y uchun interaktiv taklifnoma. Hozirgi Azizbek va Madina, 2027-yil 22-may, Navro‘z saroyi ma’lumotlari **namuna**. Suratlar Unsplash’dan olingan ilhom suratlari; haqiqiy juftlik suratlari sifatida ko‘rsatilmagan.

## Ishga tushirish

Node.js 24 yoki yangi versiyasi kerak. Tashqi kutubxona o‘rnatilmaydi.

```sh
node server.mjs
```

Brauzer: http://localhost:3000. `node --test test.mjs` — API tekshiruvlari.

## Ma’lumotlarni almashtirish

`event.json` faylida ismlar, sana, javob muddati, manzil, Google Maps qidiruv so‘rovi va dastur yoziladi. Vaqtlar `+05:00` bilan Toshkent vaqtida. Haqiqiy ma’lumotlar kiritilganda `demo` qiymatini `false` qiling. Rasmlar: `hero.jpg`, `gallery-1.jpg`, `gallery-2.jpg`, `gallery-3.jpg`. Sahifadagi hikoya matni `index.html` ichida. Shaxsiy havola: `/?guest=Feruzbek`.

## Imkoniyatlar

- Telefon, planshet va kompyuterga mos dizayn; mobil menyu.
- Aniq sana va vaqt, soniyali sanagich; tadbir boshlanganda va tugaganda holat yangilanadi.
- Slayder, suratni kattalashtirish, klaviatura orqali yurish, modal oynalar.
- To‘y dasturi, xarita modali, Google Maps’da yo‘l olish.
- Taqvimga `.ics` fayl orqali saqlash, havola ulashish.
- Faqat foydalanuvchi yoqqanda ijro etiladigan original sokin sintez kuy.
- Ishtirokni tasdiqlash, 1–6 mehmon, tilak yozish; SQLite’ga saqlash.
- Shu brauzerdan qayta yuborilganda javob yangilanadi; ism va tilaklar ommaga ochilmaydi.
- Server validatsiyasi, so‘rov hajmi cheklovi, oddiy spam cheklovi, xavfsizlik sarlavhalari.

## Railway

GitHub repozitoriyini Railway xizmatiga ulang. Dockerfile avtomatik tanlanadi. `/data` manziliga **persistent volume** ulang — javoblar qayta deploydan keyin ham saqlanishi uchun bu shart. Server `PORT` ni avtomatik o‘qiydi, healthcheck: `/api/health`. Tashqi domen yarating.

Muhit o‘zgaruvchilari: `PORT` (Railway beradi), `DATA_DIR=/data` (Dockerfile’da berilgan), ixtiyoriy `ADMIN_TOKEN` (Railway Variables’da uzun tasodifiy qiymat). Token berilmagan bo‘lsa mehmonlar ro‘yxatini o‘qish yopiq qoladi. Ro‘yxatni olish: `GET /api/guests`, `Authorization: Bearer ...`. Tokenni GitHub yoki frontend kodga yozmang.

SQLite bitta Railway replikasi uchun. Ko‘p replika kerak bo‘lsa PostgreSQL’ga o‘tkazing. Mehmon javoblari demo loyihada ham serverga saqlanadi; haqiqiy tadbirdan oldin demo javoblarini alohida bazaga ajrating.

## Suratlar

Unsplash foto identifikatorlari: `photo-1519741497674-611481863552`, `photo-1519225421980-715cb0215aed`, `photo-1511795409834-ef04bbd61622`, `photo-1523438885200-e635ba2c371e`. Shriftlar: Google Fonts — Cormorant Garamond va Manrope. Shriftlar yuklanmasa, tizim shriftlari ishlaydi.
