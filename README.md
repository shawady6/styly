# Styly 👔

تطبيق تنسيق هدوم الدولاب. البيانات والصور بتتخزن على الموبايل نفسه (IndexedDB).

## تجربة سريعة (PWA)
ارفع مجلد `www/` على GitHub Pages وافتح الرابط من Chrome ثم "Add to Home Screen".

## بناء الـ APK
1. اعمل ريبو جديد على GitHub وارفع محتويات هذا المجلد (branch: `main`).
2. افتح تبويب **Actions** ثم **Build APK**، وانتظر لحد ما يخلص (~5 دقايق).
3. نزّل `styly-debug-apk` من الـ Artifacts، فك الضغط وثبّت `app-debug.apk` على الموبايل.

## بناء محلي (اختياري)
```bash
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## المميزات
- إضافة قطعة بالكاميرا (نوع، لون، موسم، مناسبة)
- فلترة الدولاب بالنوع
- تنسيق طقم يدوي أو عشوائي وحفظه
