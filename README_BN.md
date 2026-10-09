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

## নতুন Services & Profit মডিউল
- সার্ভিস টেমপ্লেট: নিজের সার্ভিসের নাম, চার্জ, সরাসরি/অন্যান্য খরচ, প্রসেসিং সময় এবং কাস্টম ডকুমেন্ট চেকলিস্ট সংরক্ষণ।
- Service Cost & Profit Calculator: চার্জ, খরচ, আনুমানিক লাভ ও লাভের হার তাৎক্ষণিক হিসাব।
- Quotation Generator: নির্বাচিত টেমপ্লেট থেকে কাস্টমারের জন্য কোটেশনের টেক্সট তৈরি; প্রিন্ট ডায়ালগ থেকে PDF হিসেবেও সংরক্ষণ করা যায়।
- Profit Forecast: মাসিক কাজের সংখ্যা ও প্রতি কাজের চার্জ/খরচ থেকে পূর্বাভাস।
- Actual vs Estimated: প্রতিটি কাজের আনুমানিক ও প্রকৃত খরচের পার্থক্য।
- Payment & Pending Work: কাজের স্ট্যাটাস ও পেমেন্ট স্ট্যাটাসের তালিকা।
- Document checklist: প্রতিটি টেমপ্লেটে নথির স্ট্যাটাস টিক দিয়ে রাখা যায়।

নোট: অ্যাপটি offline-first এবং ডেটা এই ডিভাইসের browser/WebView storage-এ থাকে। নিয়মিত JSON backup নিন। নথির তালিকা ব্যবহারকারী-নির্ধারিত; সরকারি/আইনগতভাবে বাধ্যতামূলক তালিকা নয়। এটি হিসাবের আনুমানিক টুল, ট্যাক্স বা আইনি পরামর্শ নয়।

### যাচাই
`app/src/main/assets/www/app.js`-এর JavaScript syntax `node --check` দিয়ে যাচাই করা হয়েছে। Android APK তৈরির জন্য Android SDK/Gradle-সহ পরিবেশে `./gradlew assembleDebug` চালান।
