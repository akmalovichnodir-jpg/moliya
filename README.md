# Moliya

Shaxsiy moliyani nazorat qilish uchun iPhone'ga oʻrnatiladigan web-ilova (PWA).
Asosiy gʻoya: **oy oxirida qancha tejab qolmoqchi ekaningizni kiritasiz — ilova har kuni qancha sarflash mumkinligini (kunlik limitni) hisoblab beradi.**

## Qanday ishlaydi

```
kunlik limit = (tushum − tejash maqsadi − majburiy toʻlovlar − kundalik xarajatlar) ÷ oy oxirigacha qolgan kunlar
```

- Limit kun davomida oʻzgarmaydi. Kam sarflasangiz — ertangi limit oshadi, koʻp sarflasangiz — kamayadi.
- Tushum rejadan oshsa, limit koʻtariladi.
- **Majburiy toʻlovlar** (Ijara, Kommunal, Kredit toifalari) kunlik limitga kirmaydi — ular oy budjetidan oldindan ajratiladi.
- «Tahlil» boʻlimida kunlik xarajatlar grafigi va toifalar boʻyicha taqsimot bor.
- Maʼlumotlar faqat qurilmaning oʻzida saqlanadi (`localStorage`); «Sozlamalar»dan zaxira nusxa olish va tiklash mumkin.

## iPhone'ga oʻrnatish

1. Ilova manzilini **Safari**'da oching.
2. «Ulashish» tugmasi → **«Ekranga qoʻshish»** (Add to Home Screen).
3. Ilovani ekrandagi belgidan oching va sozlashni oʻsha yerda bajaring
   (Safari va oʻrnatilgan ilovaning xotirasi alohida).

## Joylashtirish (GitHub Pages)

Build bosqichi yoʻq — oddiy statik fayllar.
Repo → **Settings → Pages → Source: Deploy from a branch** → branch va `/ (root)` ni tanlang.

## Lokal ishga tushirish

```
python3 -m http.server 8000
```

va brauzerda `http://localhost:8000` ni oching.

## Tuzilishi

| Fayl | Vazifasi |
|---|---|
| `index.html` | Sahifa qobigʻi |
| `css/app.css` | Dizayn (yorugʻ va tungi mavzu) |
| `js/app.js` | Butun mantiq: hisob-kitob, ekranlar, saqlash |
| `sw.js` | Oflayn ishlash uchun service worker |
| `manifest.webmanifest`, `icons/` | Ilova sifatida oʻrnatish uchun |
