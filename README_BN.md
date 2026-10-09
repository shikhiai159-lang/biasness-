# ServicePilot Android — একবার ইনস্টল, আইকনে ট্যাপ করে চালু

এটি ServicePilot-এর Android WebView wrapper project। অ্যাপের HTML/CSS/JavaScript Android APK-এর ভিতরে থাকে, তাই অ্যাপের মূল ফিচার চালাতে ক্লাউড সার্ভার দরকার নেই। ডেটা ডিভাইসের WebView local storage-এ রাখা হয়।

## গুরুত্বপূর্ণ
- এই ZIP নিজে APK নয়; এটি APK তৈরি করার Android project source। এই পরিবেশে Android SDK/Gradle দিয়ে APK compile করা যায়নি।
- GitHub Actions দিয়ে বিনামূল্যে debug APK build করা যাবে। APK ইনস্টল করার আগে Android-এর অনুমতি চাইতে পারে।
- Debug APK প্রকাশ্য বাণিজ্যিক রিলিজের জন্য নয়। পরে নিজের keystore দিয়ে signed release APK তৈরি করুন।
- App data clear/uninstall করলে local data হারাতে পারে। অ্যাপের Settings থেকে JSON backup নিন।
- এই সংস্করণে cloud, account login, sync বা subscription নেই।

## ফোন থেকে APK বানানোর ধাপ
1. ZIP Extract করুন।
2. GitHub-এ নতুন repository তৈরি করুন, যেমন `ServicePilot-Android`।
3. এই ফোল্ডারের সব ফাইল GitHub repository-তে upload করুন (browser upload অথবা GitHub mobile app)। `.github/workflows/build-apk.yml`-সহ সব ফাইল থাকতে হবে।
4. GitHub repository → Actions → **Build ServicePilot Android APK** → **Run workflow** চাপুন।
5. সবুজ checkmark হলে build run খুলুন, Artifacts অংশ থেকে `ServicePilot-Android-APK` ডাউনলোড করুন।
6. ZIP খুলে `app-debug.apk` ফোনে ইনস্টল করুন। প্রয়োজনে Android Settings-এ ওই অ্যাপ/ব্রাউজারের “Install unknown apps” অনুমতি দিন। শুধু নিজের তৈরি/বিশ্বস্ত APK ইনস্টল করুন।
7. হোম স্ক্রিনে ServicePilot আইকনে একবার ট্যাপ করলেই অ্যাপ খুলবে।

## Build configuration
- Package: `com.servicepilot.offline`
- Minimum Android: 6.0 (API 23)
- Version: 1.0.0 (debug)
- No INTERNET permission declared; app loads bundled local files.

## Business Command Center Premium — যুক্ত মডিউল
- Sales records, clients, jobs, invoices/payments ও expenses
- Products & inventory with low-stock threshold
- Tasks, goals & KPI tracker
- Service templates with user-defined document checklist
- Service cost/profit calculator (চার্জ, সরাসরি খরচ, অন্যান্য খরচ, লাভ ও margin)
- CSV exports, JSON backup/restore এবং offline local storage
- `docs/Small_Business_Command_Center_Premium.xlsx`: Excel workbook with dashboard, sales, expenses, customers, products, invoices, tasks/KPI, service templates, monthly summary trend chart and buyer guide.
- `docs/Mobile_Companion.html`: standalone mobile calculator and customizable document checklist.

ডেমো workbook-এর sample rows বাস্তব ডেটা দিয়ে প্রতিস্থাপন করুন। নথির তালিকা নিজে নির্ধারণ করুন এবং সরকারি/আইনগত প্রয়োজনীয়তা আলাদাভাবে যাচাই করুন। অ্যাপটি এখনও এই প্যাকেজে APK হিসেবে rebuild করা হয়নি; এটি আপডেট করা source project এবং companion workbook।
