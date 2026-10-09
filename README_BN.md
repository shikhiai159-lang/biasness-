# ServicePilot Business Command Center Premium — Revised Build

এই সংস্করণে রেফারেন্স ড্যাশবোর্ডের মতো একটি প্রিমিয়াম বিজনেস-ওভারভিউ, কাজ/পণ্যের ছবি সংযুক্তি এবং invoice/payment হিসাব উন্নত করা হয়েছে। এটি অফলাইন-ফার্স্ট Android WebView অ্যাপ; ডেটা এই ডিভাইসের browser storage-এ থাকে। আলাদা ডিভাইসের সঙ্গে স্বয়ংক্রিয় sync নেই।

## আপডেট
- Navy/teal premium dashboard hero, KPI cards, ৬ মাসের revenue/expense trend bars, quick actions ও job progress.
- Product এবং job/project-এ ঐচ্ছিক ছবি আপলোড (JPG/PNG/WebP, সর্বোচ্চ 1.5 MB), preview, local storage-এ সংরক্ষণ ও remove option.
- Invoice-এ একাধিক line item (`Description | Quantity | Unit price`), subtotal, discount, tax, invoice total, payment received এবং balance due.
- Partial payment রেকর্ড করা যায়; outstanding balance কমে, balance শূন্য হলে Paid status হয় এবং overdue status due date থেকে গণনা হয়.
- Invoice PDF/print-এ customer/business details, item rows, subtotal/discount/tax, payments received এবং balance due.
- Invoice totals/dashboard/reporting-এ payment received ও remaining balance আলাদা করে গণনা.

## ব্যবহার
1. Android Studio-তে project খুলুন।
2. Gradle sync করুন এবং Android SDK 35 ইনস্টল আছে নিশ্চিত করুন।
3. `app` configuration থেকে Debug APK build করুন।
4. প্রথমবার ব্যবহারের আগে Settings-এ business name, address, phone, email, currency ও invoice prefix দিন।
5. আগে customer যোগ করে তারপর job বা invoice তৈরি করুন।
6. Invoice line items প্রতি লাইনে এভাবে লিখুন: `Website design | 1 | 15000`। Qty × unit price থেকে amount হিসাব হয়।
7. Invoice list থেকে `Record payment` বেছে received amount লিখুন। বাকি টাকা invoice-এ দেখা যাবে।
8. Settings থেকে নিয়মিত JSON backup নিন। ছবি-সহ backup বড় হতে পারে।

## গুরুত্বপূর্ণ সীমা
- এটি GST/tax compliance engine নয়। GSTIN, HSN/SAC, place-of-supply, statutory numbering বা স্থানীয় আইনগত শর্ত স্বয়ংক্রিয়ভাবে যাচাই করে না। প্রযোজ্য হলে accountant/qualified professional-এর সঙ্গে invoice fields যাচাই করুন।
- Payment record কেবল আপনার দেওয়া amount track করে; bank/payment gateway-এর সঙ্গে সংযুক্ত নয়।
- ছবি local storage-এ থাকে, cloud backup বা encryption/sync নেই। সংবেদনশীল পরিচয়পত্রের ছবি রাখবেন না।
- JavaScript syntax এবং ZIP integrity যাচাই করা হয়েছে; এই পরিবেশে Android SDK/Gradle build ও physical-device end-to-end test করা যায়নি। তাই APK build ও device testing এখনো প্রয়োজন।


## নতুন মডিউল (Tender Desk + Purchase Bills)
- Purchase Bills: supplier invoice, item-wise quantity/rate, GST estimate, paid amount and balance due. Original supplier invoice and applicable tax rules যাচাই করুন।
- Tender Desk: official CPPP/eProcurement/GeM portal links, tender tracker, deadlines and preparation checklist. Actual bid submission remains on the official portal and may require DSC/login/OTP; this offline app cannot submit bids automatically.

## সংশোধন প্যাক (ফাইল আপলোড, ইনভয়েস, টেন্ডার লিংক)
- Android WebView-এর `onShowFileChooser` যুক্ত করা হয়েছে, যাতে ছবি/JSON ফাইল বাছাই করা যায়।
- পণ্যের/কাজের ছবি বাছাইয়ের পরে JPEG-এ রিসাইজ ও কমপ্রেস করে লোকাল রেকর্ডে রাখা হয়।
- বাইরের HTTPS পোর্টালগুলো WebView-এর ভেতরে না খুলে ডিভাইসের ব্রাউজারে খোলে; এতে `ERR_CACHE_MISS`-এর সাধারণ WebView navigation সমস্যা এড়ানোর চেষ্টা করা হয়েছে। নেটওয়ার্ক/পোর্টাল সমস্যা থাকলে ব্রাউজারেও আলাদা ত্রুটি হতে পারে।
- Sales invoice-এ GST / CGST+SGST / IGST এবং Non-GST নির্বাচন আছে। Sales invoice থেকে বাধ্যতামূলক due date সরানো হয়েছে; unpaid/part-paid হিসাব পেমেন্ট থেকে গণনা হয়।
- সরকারি eProcurement-এ বিড সরাসরি অ্যাপ থেকে জমা দেওয়ার ভান করা হয় না। পোর্টালে লগইন, bidder enrolment এবং প্রযোজ্য ক্ষেত্রে DSC/e-token দরকার; অ্যাপ অফিসিয়াল পোর্টাল খুলে দেয় এবং আলাদা tender tracker/checklist দেয়।
- সোর্স কোডের JavaScript syntax ও ZIP integrity পরীক্ষা করা হয়েছে; পূর্ণ Android APK build/device test এখনও করা হয়নি। GST নথির আইনি বৈধতা ব্যবহারকারীর ব্যবসার প্রযোজ্য নিয়ম অনুযায়ী যাচাই করতে হবে।
