import {useSyncExternalStore} from 'react';
export type Language='en'|'fa'|'ps';
const KEY='thread-ledger-language';

const valid=(v:unknown):v is Language=>v==='en'||v==='fa'||v==='ps';
let current:Language='en';
try{const saved=localStorage.getItem(KEY);if(valid(saved))current=saved}catch{/* Browser storage may be unavailable. */}
const listeners=new Set<()=>void>();
function apply(){if(typeof document!=='undefined'){document.documentElement.lang=current;document.documentElement.dir=current==='en'?'ltr':'rtl';document.title=current==='fa'?'مدیریت خیاطی':current==='ps'?'د خیاطۍ مدیریت':'Tailor Studio | Tailoring Management'}}
apply();
export const language=()=>current;
export function setLanguage(value:string){if(!valid(value))return;try{localStorage.setItem(KEY,value);}catch{/* Keep language switching usable if storage is unavailable. */}if(current!==value){current=value;apply();listeners.forEach(f=>f())}}
export function useLanguage(){return useSyncExternalStore(cb=>{listeners.add(cb);return()=>{listeners.delete(cb)}},language,()=> 'en' as Language)}
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key===KEY&&valid(e.newValue)&&e.newValue!==current){current=e.newValue;apply();listeners.forEach(f=>f())}});
export const locale=()=>current==='fa'?'fa-AF-u-ca-gregory':current==='ps'?'ps-AF-u-ca-gregory':'en-GB';
export const formatNumber=(n:number)=>new Intl.NumberFormat(current==='en'?'en-GB':'fa-AF').format(n);
export const translations:Record<string,[string,string]>={};
const rows=`
Table pagination|صفحه‌بندی جدول|د جدول پاڼې
Rows per page|ردیف در هر صفحه|په هره پاڼه کې کتارونه
Showing {from}–{to} of {total}|نمایش {from}–{to} از {total}|له {total} څخه {from}–{to} ښودل کېږي
Page {page} of {pages}|صفحه {page} از {pages}|له {pages} څخه {page} پاڼه
First page|صفحه اول|لومړۍ پاڼه
Previous page|صفحه قبلی|مخکینۍ پاڼه
Next page|صفحه بعدی|بله پاڼه
Last page|صفحه آخر|وروستۍ پاڼه
Notifications|اعلان‌ها|خبرتیاوې
Notifications ({count} unread)|اعلان‌ها ({count} خوانده‌نشده)|خبرتیاوې ({count} نالوستې)
Order reminders|یادآوری سفارش‌ها|د سپارښتنو یادونې
Close notifications|بستن اعلان‌ها|خبرتیاوې بندې کړئ
Mark all as read|علامت‌گذاری همه به‌عنوان خوانده‌شده|ټولې د لوستل شوو په توګه نښه کړئ
No notifications|اعلانی وجود ندارد|خبرتیا نشته
Your orders are on track.|سفارش‌های شما طبق برنامه پیش می‌روند.|ستاسو سپارښتنې له پلان سره سم روانې دي.
Unread|خوانده‌نشده|نالوستې
Tailor Studio|مدیریت خیاطی|د خیاطۍ مدیریت
Your shop|دکان شما|ستاسو دوکان
Shop settings|تنظیمات دکان|د دوکان تنظیمات
Expand sidebar|باز کردن نوار کناری|اړخیز پټی پراخ کړئ
Collapse sidebar|جمع کردن نوار کناری|اړخیز پټی راټول کړئ
System|سیستم|سیسټم
Appearance|ظاهر|بڼه
Theme|پوسته|رنګیزه بڼه
Use system setting|استفاده از تنظیم سیستم|د سیسټم تنظیم وکاروئ
Light|روشن|روښانه
Dark|تاریک|تیاره
Choose a theme. Your preference is remembered in this browser.|پوسته را انتخاب کنید. انتخاب شما در این مرورگر ذخیره می‌شود.|یوه بڼه وټاکئ. ستاسو انتخاب په دې براوزر کې خوندي کېږي.
Account|حساب کاربری|حساب
Shop owner|مالک دکان|د دوکان مالک
Shop|دکان|دوکان
Language|زبان|ژبه
Dashboard|داشبورد|ډشبورډ
Customers|مشتریان|پېرودونکي
Orders|سفارش‌ها|سپارښتنې
Payments|پرداخت‌ها|تادیات
Reports|گزارش‌ها|راپورونه
Settings|تنظیمات|تنظیمات
Workspace|محیط کار|کاري چاپېریال
WORKSPACE|محیط کار|کاري چاپېریال
TAILORING WORKSPACE|محیط کار خیاطی|د خیاطۍ کاري چاپېریال
TAILORING MANAGEMENT|مدیریت خیاطی|د خیاطۍ مدیریت
YOUR SHOP WORKSPACE|محیط کار دکان شما|ستاسو د دوکان کاري چاپېریال
YOUR SHOP, AT A GLANCE|دکان شما در یک نگاه|ستاسو دوکان په یوه نظر
YOUR CRAFT. YOUR WORKSPACE.|هنر شما. محیط کار شما.|ستاسو هنر. ستاسو کاري چاپېریال.
PRIVATE SHOP WORKSPACE|محیط خصوصی دکان|د دوکان شخصي کاري چاپېریال
Welcome back.|خوش آمدید.|ښه راغلاست.
Every great fit|هر لباس خوش‌دوخت|هر ښه ګنډل شوی لباس
starts with trust.|با اعتماد آغاز می‌شود.|په باور پیلېږي.
A calm space for your customers, measurements, orders and the details that make your work yours.|محیطی آرام برای مدیریت مشتریان، اندازه‌ها، سفارش‌ها و جزئیات کار شما.|ستاسو د پېرودونکو، اندازو، سپارښتنو او د کار د جزئیاتو د مدیریت لپاره یو آرام ځای.
Every measurement remembered|هر اندازه، محفوظ و در دسترس|هره اندازه خوندي او په لاس کې
Every order on track|هر سفارش، قابل پیگیری|هره سپارښتنه د څارنې وړ
Every payment accounted for|هر پرداخت، ثبت و مشخص|هره تادیه ثبت او روښانه
Tailoring management, made personal.|مدیریت خیاطی مطابق نیاز شما.|ستاسو د اړتیاوو لپاره د خیاطۍ مدیریت.
Continue with your authorized ChatGPT account to open your tailoring workspace.|برای ورود به محیط خیاطی، با حساب مجاز ChatGPT خود ادامه دهید.|خپل د خیاطۍ کاري چاپېریال ته د ننوتلو لپاره له خپل مجاز ChatGPT حساب سره دوام ورکړئ.
Continue with ChatGPT|ادامه با ChatGPT|له ChatGPT سره دوام
Owner-only access. The hosting service verifies your account before granting access.|دسترسی فقط برای مالک است. سرویس میزبانی پیش از ورود، حساب شما را تأیید می‌کند.|یوازې مالک لاسرسی لري. د کوربه‌توب خدمت تر ننوتلو مخکې ستاسو حساب تاییدوي.
No separate shop password to create or remember.|به ساختن یا حفظ رمز جداگانه برای دکان نیاز ندارید.|د دوکان لپاره د جلا پټنوم جوړولو یا یادولو ته اړتیا نشته.
Sample records and your changes stay in this browser. This demo is separate from your downloaded SQLite application.|ریکاردهای نمونه و تغییرات شما در همین مرورگر می‌مانند. این نسخه آزمایشی از برنامه دانلودشده SQLite جدا است.|نمونوي ریکارډونه او ستاسو بدلونونه په همدې براوزر کې پاتې کېږي. دا ازمایښتي نسخه له ډاونلوډ شوي SQLite پروګرام څخه جلا ده.
Sign out|خروج|وتل
Sign out of this site|خروج از این سایت|له دې سایټ څخه وتل
Authentication enabled|احراز هویت فعال است|د هویت تایید فعال دی
ChatGPT sign-in · Owner-only access, enforced by the hosting service.|ورود با ChatGPT؛ دسترسی فقط برای مالک، با کنترل سرویس میزبانی.|د ChatGPT له لارې ننوتل؛ د کوربه‌توب خدمت یوازې مالک ته لاسرسی ورکوي.
Browser demo|نسخه آزمایشی مرورگر|د براوزر ازمایښتي نسخه
Browser demo · sample data|نسخه آزمایشی؛ معلومات نمونه|ازمایښتي نسخه؛ نمونوي معلومات
LIVE BROWSER DEMO|نسخه آزمایشی آنلاین|آنلاین ازمایښتي نسخه
Fictional sample data. Changes stay in this browser only. Download a JSON backup before clearing browser data.|معلومات نمونه و غیرواقعی است. تغییرات فقط در همین مرورگر می‌مانند. پیش از پاک‌کردن معلومات مرورگر، نسخه پشتیبان JSON بگیرید.|دا خیالي نمونوي معلومات دي. بدلونونه یوازې په همدې براوزر کې پاتې کېږي. د براوزر د معلوماتو له پاکولو مخکې د JSON شاتړ واخلئ.
Your craft. Your customers.|هنر شما. مشتریان شما.|ستاسو هنر. ستاسو پېرودونکي.
Everything in one place.|همه چیز در یک جا.|هر څه په یوه ځای کې.
Version 1.0|نسخه ۱.۰|نسخه ۱.۰
Made for the craft. Built for your everyday.|برای هنر شما و کارهای روزمره‌تان.|ستاسو د هنر او ورځني کار لپاره.
Saved in this browser|ذخیره در همین مرورگر|په همدې براوزر کې خوندي کېږي
A little order. A lot of craft.|کار منظم، دوخت باکیفیت.|منظم کار، باکیفیته ګنډل.
Keep your work flowing and every promise on track.|کارها را منظم نگه دارید و سفارش‌ها را به‌موقع تحویل دهید.|خپل کار منظم وساتئ او سپارښتنې پر وخت وسپارئ.
Know every customer. Remember every detail.|هر مشتری را بشناسید و جزئیاتش را نگه دارید.|هر پېرودونکی وپېژنئ او جزئیات یې وساتئ.
From the first measurement to the final stitch.|از اولین اندازه‌گیری تا آخرین بخیه.|له لومړۍ اندازه اخیستنې تر وروستي ټک پورې.
Clear payments. Confident balances.|پرداخت‌های روشن، بیلانس‌های دقیق.|روښانه تادیات، دقیق بیلانسونه.
A clear picture of your shop’s activity.|تصویری روشن از فعالیت دکان شما.|ستاسو د دوکان د فعالیت روښانه انځور.
Make this workspace your own.|این محیط کار را مطابق نیاز خود تنظیم کنید.|دا کاري چاپېریال د خپلو اړتیاوو مطابق برابر کړئ.
Active orders|سفارش‌های فعال|فعالې سپارښتنې
Active|فعال|فعال
In your workshop|در حال کار در دکان|په دوکان کې تر کار لاندې
Due today|تحویلی امروز|د نن سپارنې
Promises to keep|سفارش‌هایی که باید تحویل شوند|هغه سپارښتنې چې باید وسپارل شي
Ready to collect|آماده دریافت|د اخیستلو لپاره چمتو
Ready for their next chapter|دوخت تمام شده، آماده تحویل|ګنډل بشپړ دي، د سپارلو لپاره چمتو
Outstanding balance|باقی‌مانده حساب|پاتې بیلانس
Across all customer orders|در تمام سفارش‌های مشتریان|د پېرودونکو په ټولو سپارښتنو کې
Today’s work|کارهای امروز|د نن کارونه
A stitch closer to happy customers.|هر بخیه، یک قدم به رضایت مشتری نزدیک‌تر.|هر ټک، د پېرودونکي رضایت ته یو ګام نږدې.
All orders|تمام سفارش‌ها|ټولې سپارښتنې
Overdue|تأخیرشده|ځنډېدلې
Pending|در انتظار|په تمه
In progress|در حال دوخت|تر ګنډلو لاندې
Ready|آماده|چمتو
Delivered|تحویل‌شده|سپارل شوې
Needs attention|نیازمند توجه|پاملرنې ته اړتیا لري
{count} overdue order|{count} سفارش تأخیرشده|{count} ځنډېدلې سپارښتنه
{count} overdue orders|{count} سفارش تأخیرشده|{count} ځنډېدلې سپارښتنې
No overdue orders|سفارش تأخیرشده ندارید|ځنډېدلې سپارښتنې نشته
A quick follow-up goes a long way.|یک پیگیری کوتاه، کار را پیش می‌برد.|لنډه تعقیبي اړیکه کار پر مخ وړي.
You’re keeping your promises.|سفارش‌ها را به‌موقع انجام می‌دهید.|تاسو سپارښتنې پر وخت بشپړوئ.
ready for pickup|آماده دریافت|د اخیستلو لپاره چمتو
Finished and waiting for collection.|دوخت تمام شده و منتظر دریافت مشتری است.|ګنډل بشپړ دي او د پېرودونکي د اخیستلو په تمه دي.
Good work starts|کار خوب|ښه کار
with the right details.|با جزئیات دقیق آغاز می‌شود.|په کره جزئیاتو پیلېږي.
Save your customer’s measurements once. Get every fit right.|اندازه‌های مشتری را یک‌بار ثبت کنید و هر بار دقیق بدوزید.|د پېرودونکي اندازې یو ځل ثبت کړئ او هر ځل دقیق لباس وګنډئ.
Work in progress|جریان کار|د کار بهیر
Your order book, from start to finish.|سفارش‌های شما، از آغاز تا پایان.|ستاسو سپارښتنې، له پیل څخه تر پایه.
All time|تمام مدت|ټوله موده
Today’s collections|دریافتی‌های امروز|د نن ترلاسه شوې پیسې
Net payments received today|خالص پرداخت‌های دریافتی امروز|نن ترلاسه شوې خالصې پیسې
Explore reports|مشاهده گزارش‌ها|راپورونه وګورئ
New customer|مشتری جدید|نوی پېرودونکی
New order|سفارش جدید|نوې سپارښتنه
Record payment|ثبت پرداخت|تادیه ثبتول
Add a customer|افزودن مشتری|پېرودونکی زیاتول
Add your first customer|اولین مشتری را اضافه کنید|خپل لومړی پېرودونکی زیات کړئ
Customer directory|فهرست مشتریان|د پېرودونکو لړلیک
Search customers|جستجوی مشتریان|د پېرودونکو لټون
Search name or phone…|جستجوی نام یا شماره…|د نوم یا شمېرې لټون…
No phone added|شماره ثبت نشده|شمېره نه ده ثبت شوې
orders|سفارش|سپارښتنې
due|باقی‌مانده|پاتې
measurement profiles|پروفایل اندازه|د اندازو پروفایلونه
Your customers belong here|مشتریان خود را اینجا ثبت کنید|خپل پېرودونکي دلته ثبت کړئ
Start with a name. Add measurements and orders as you go.|با نام شروع کنید؛ سپس اندازه‌ها و سفارش‌ها را اضافه کنید.|له نومه پیل وکړئ، بیا اندازې او سپارښتنې ورزیاتې کړئ.
Search orders|جستجوی سفارش‌ها|د سپارښتنو لټون
Search order, name or phone…|جستجوی سفارش، نام یا شماره…|د سپارښتنې، نوم یا شمېرې لټون…
Filter status|فیلتر وضعیت|د حالت چاڼ
Filter delivery date|فیلتر تاریخ تحویل|د سپارلو نېټې چاڼ
Clear delivery date|پاک‌کردن تاریخ تحویل|د سپارلو نېټه پاکول
Order / Customer|سفارش / مشتری|سپارښتنه / پېرودونکی
Garments|لباس‌ها|جامې
Delivery date|تاریخ تحویل|د سپارلو نېټه
Status|وضعیت|حالت
Balance|بیلانس|بیلانس
No orders here yet|هنوز سفارشی در این بخش نیست|په دې برخه کې لا سپارښتنه نشته
Create an order to start tracking your next piece of work.|یک سفارش ثبت کنید تا پیگیری کار بعدی را آغاز کنید.|سپارښتنه ثبت کړئ څو د خپل راتلونکي کار څارنه پیل کړئ.
Order value|ارزش سفارش‌ها|د سپارښتنو ارزښت
Net payments collected|خالص دریافتی‌ها|خالصې ترلاسه شوې پیسې
Payment history|تاریخچه پرداخت‌ها|د تادیاتو مخینه
Search payments|جستجوی پرداخت‌ها|د تادیاتو لټون
Search customer or order…|جستجوی مشتری یا سفارش…|د پېرودونکي یا سپارښتنې لټون…
Receipt / Date|رسید / تاریخ|رسید / نېټه
Customer / Order|مشتری / سفارش|پېرودونکی / سپارښتنه
Method|روش|طریقه
Amount|مبلغ|مبلغ
Actions|عملیات|کړنې
Reversal:|برگشت پرداخت:|د تادیې بېرته ګرځول:
Reversed|برگشت‌شده|بېرته ګرځول شوې
Print payment receipt|چاپ رسید پرداخت|د تادیې رسید چاپول
Reverse payment|برگشت پرداخت|تادیه بېرته ګرځول
Every payment, accounted for|هر پرداخت، ثبت و قابل پیگیری|هره تادیه ثبت او د تعقیب وړ
Record an advance or a partial payment against an order.|پیش‌پرداخت یا پرداخت قسمی یک سفارش را ثبت کنید.|د یوې سپارښتنې مخکېنۍ یا قسطي تادیه ثبت کړئ.
Unpaid orders|سفارش‌های دارای باقی‌مانده|د پاتې بیلانس لرونکې سپارښتنې
Business activity|فعالیت کاروبار|د کاروبار فعالیت
Order revenue and collections are shown separately.|ارزش سفارش‌ها و مبالغ دریافتی جدا نمایش داده می‌شوند.|د سپارښتنو ارزښت او ترلاسه شوې پیسې جلا ښودل کېږي.
From|از|له
To|تا|تر
to|تا|تر
Today|امروز|نن
This month|این ماه|دا میاشت
The start date must be before the end date.|تاریخ شروع باید پیش از تاریخ پایان باشد.|د پیل نېټه باید د پای له نېټې مخکې وي.
Order revenue in period|ارزش سفارش‌ها در این دوره|په دې موده کې د سپارښتنو ارزښت
Net collections in period|خالص دریافتی‌ها در این دوره|په دې موده کې خالصې ترلاسه شوې پیسې
Orders delivered in period|سفارش‌های تحویل‌شده در این دوره|په دې موده کې سپارل شوې سپارښتنې
Orders accepted in period|سفارش‌های ثبت‌شده در این دوره|په دې موده کې ثبت شوې سپارښتنې
These figures show revenue and cash collections, not net profit. Expenses and production costs are outside this release.|این ارقام ارزش سفارش‌ها و دریافتی‌ها را نشان می‌دهند، نه مفاد خالص. مصارف و هزینه تولید در این نسخه ثبت نمی‌شوند.|دا شمېرې د سپارښتنو ارزښت او ترلاسه شوې پیسې ښيي، نه خالصه ګټه. لګښتونه او د تولید مصارف په دې نسخه کې نه ثبتېږي.
Current outstanding, all orders|باقی‌مانده فعلی تمام سفارش‌ها|د ټولو سپارښتنو اوسنی پاتې بیلانس
Currently overdue|سفارش‌های فعلاً تأخیرشده|اوسنۍ ځنډېدلې سپارښتنې
Total customers|مجموع مشتریان|ټول پېرودونکي
Edit customer|ویرایش مشتری|د پېرودونکي سمون
Edit measurements|ویرایش اندازه‌ها|د اندازو سمون
New measurements|اندازه‌های جدید|نوې اندازې
Create an order|ایجاد سفارش|سپارښتنه جوړول
Order|سفارش|سپارښتنه
Record a payment|ثبت یک پرداخت|تادیه ثبتول
Reverse a payment|برگشت یک پرداخت|تادیه بېرته ګرځول
Measurement history|تاریخچه اندازه‌ها|د اندازو مخینه
Close dialog|بستن پنجره|کړکۍ تړل
No phone number|شماره ندارد|شمېره نشته
No customer notes yet.|هنوز یادداشتی برای مشتری ثبت نشده است.|د پېرودونکي لپاره لا یادښت نه دی ثبت شوی.
Customer since|مشتری از تاریخ|پېرودونکی له نېټې
Edit details|ویرایش مشخصات|د جزئیاتو سمون
Measurements|اندازه‌ها|اندازې
Order history|تاریخچه سفارش‌ها|د سپارښتنو مخینه
Saved measurement profiles|پروفایل‌های اندازه ذخیره‌شده|خوندي شوي د اندازو پروفایلونه
· Version|؛ نسخه|؛ نسخه
History|تاریخچه|مخینه
Edit|ویرایش|سمون
A great fit starts here|دوخت دقیق از اینجا آغاز می‌شود|دقیق ګنډل له دې ځایه پیلېږي
Save a measurement profile for this customer.|برای این مشتری یک پروفایل اندازه ثبت کنید.|د دې پېرودونکي لپاره د اندازو پروفایل ثبت کړئ.
Ordered|تاریخ سفارش|د سپارښتنې نېټه
· Due|؛ تحویل|؛ سپارل
Print receipt|چاپ رسید|رسید چاپول
Select a step to update status. Delivery does not automatically record payment.|برای تغییر وضعیت، مرحله را انتخاب کنید. تحویل سفارش، پرداخت را خودکار ثبت نمی‌کند.|د حالت بدلولو لپاره پړاو وټاکئ. د سپارښتنې سپارل تادیه په اتومات ډول نه ثبتوي.
Delivered:|تحویل‌شده:|سپارل شوې:
Saved measurements ·|اندازه‌های ذخیره‌شده؛|خوندي شوې اندازې؛
No measurement profile attached.|پروفایل اندازه ضمیمه نشده است.|د اندازو پروفایل نه دی ورسره تړل شوی.
Order total|مجموع سفارش|د سپارښتنې ټول مبلغ
Paid|پرداخت‌شده|ورکړل شوې
Remaining|باقی‌مانده|پاتې
Status history|تاریخچه وضعیت|د حالت مخینه
Payment receipt|رسید پرداخت|د تادیې رسید
Order receipt|رسید سفارش|د سپارښتنې رسید
Customer:|مشتری:|پېرودونکی:
Due:|تحویل:|سپارل:
Status:|وضعیت:|حالت:
Item|قلم|توکی
Qty|تعداد|شمېر
Total:|مجموع:|ټول:
Total paid (net):|مجموع خالص پرداخت‌شده:|ټولې خالصې ورکړل شوې پیسې:
Balance:|باقی‌مانده:|پاتې بیلانس:
This transaction:|این پرداخت:|دا تادیه:
Payment date:|تاریخ پرداخت:|د تادیې نېټه:
Method:|روش:|طریقه:
Reversal reason:|دلیل برگشت:|د بېرته ګرځولو لامل:
Printed:|تاریخ چاپ:|د چاپ نېټه:
Thank you for trusting us with your next perfect fit.|از اعتماد شما برای دوخت لباس‌تان سپاسگزاریم.|د خپلو جامو د ګنډلو لپاره ستاسو له باور څخه مننه.
Save changes|ذخیره تغییرات|بدلونونه خوندي کول
Saving…|در حال ذخیره…|خوندي کېږي…
Full name *|نام کامل *|بشپړ نوم *
Customer’s full name|نام کامل مشتری|د پېرودونکي بشپړ نوم
Phone number|شماره تماس|د اړیکې شمېره
07xx xxx xxx|۰۷xx xxx xxx|۰۷xx xxx xxx
A customer with this name or phone already exists. Check the directory before saving another record.|مشتری با این نام یا شماره موجود است. پیش از ثبت دوباره، فهرست را بررسی کنید.|په دې نوم یا شمېره پېرودونکی شته. د بیا ثبتولو مخکې لړلیک وګورئ.
Notes|یادداشت‌ها|یادښتونه
Preferences or details worth remembering…|سلیقه یا جزئیاتی که باید به یاد بماند…|خوښه یا هغه جزئیات چې باید یاد پاتې شي…
Save customer|ذخیره مشتری|پېرودونکی خوندي کول
Create customer|ثبت مشتری|پېرودونکی ثبتول
Profile name *|نام پروفایل *|د پروفایل نوم *
Everyday shalwar kameez|پیراهن‌تنبان روزمره|ورځنی کمیس پرتوګ
Clothing type|نوع لباس|د جامو ډول
Measurement unit|واحد اندازه‌گیری|د اندازې واحد
Inches|اینچ|انچ
Centimeters|سانتی‌متر|سانتي متر
in|اینچ|انچ
cm|سانتی‌متر|سانتي متر
e.g. 38|مثلاً ۳۸|لکه ۳۸
Fitting preferences|سلیقه دوخت|د ګنډلو خوښه
Loose fitting, narrow sleeves…|دوخت آزاد، آستین تنگ…|آزاد ګنډل، تنګ لستوڼي…
Enter at least one measurement. Older orders keep their original measurements.|حداقل یک اندازه وارد کنید. سفارش‌های قبلی اندازه‌های اصلی خود را نگه می‌دارند.|لږ تر لږه یوه اندازه ولیکئ. پخوانۍ سپارښتنې خپلې اصلي اندازې ساتي.
Save measurements|ذخیره اندازه‌ها|اندازې خوندي کول
Loading…|در حال بارگذاری…|راپورته کېږي…
No earlier versions|نسخه قبلی موجود نیست|پخوانۍ نسخه نشته
Previous measurements will appear here when you update this profile.|پس از ویرایش این پروفایل، اندازه‌های قبلی اینجا نمایش داده می‌شوند.|د دې پروفایل له سمون وروسته پخوانۍ اندازې دلته ښودل کېږي.
Customer *|مشتری *|پېرودونکی *
Select a customer|مشتری را انتخاب کنید|پېرودونکی وټاکئ
Promised delivery date *|تاریخ وعده تحویل *|د سپارلو ژمنه شوې نېټه *
Add a new customer first|ابتدا مشتری جدید اضافه کنید|لومړی نوی پېرودونکی زیات کړئ
CLOTHING ITEMS|اقلام لباس|د جامو توکي
Remove item|حذف قلم|توکی لرې کول
Quantity|تعداد|شمېر
Unit price (AFN)|قیمت فی واحد (افغانی)|د یوه توکي بیه (افغانۍ)
Saved measurements|اندازه‌های ذخیره‌شده|خوندي شوې اندازې
No measurement profile|بدون پروفایل اندازه|د اندازو پروفایل نشته
Item instructions|توضیحات قلم|د توکي لارښوونې
Collar style, finishing details…|مدل یخن، جزئیات نهایی دوخت…|د یخن بڼه، د ګنډلو وروستي جزئیات…
Add clothing item|افزودن قلم لباس|د جامو توکی زیاتول
Order instructions|توضیحات سفارش|د سپارښتنې لارښوونې
Anything else to remember?|نکته دیگری برای یادآوری دارید؟|د یادولو لپاره بل څه شته؟
Advance payment (AFN)|پیش‌پرداخت (افغانی)|مخکېنۍ تادیه (افغانۍ)
Optional|اختیاری|اختیاري
Remaining balance|باقی‌مانده حساب|پاتې بیلانس
Create order|ثبت سفارش|سپارښتنه ثبتول
Order *|سفارش *|سپارښتنه *
Select an unpaid order|سفارش دارای باقی‌مانده را انتخاب کنید|د پاتې بیلانس لرونکې سپارښتنه وټاکئ
Amount (AFN) *|مبلغ (افغانی) *|مبلغ (افغانۍ) *
Enter payment amount|مبلغ پرداخت را وارد کنید|د تادیې مبلغ ولیکئ
Payment method|روش پرداخت|د تادیې طریقه
Cash|نقدی|نغدي
Bank transfer|انتقال بانکی|بانکي لېږد
A receipt opens after saving. Corrections remain visible through payment reversals.|پس از ذخیره، رسید باز می‌شود. اصلاحات از طریق برگشت پرداخت در تاریخچه باقی می‌مانند.|له خوندي کولو وروسته رسید پرانیستل کېږي. د تادیې د بېرته ګرځولو اصلاحات په مخینه کې پاتې کېږي.
Record & print|ثبت و چاپ|ثبت او چاپ
This reverses the full payment and increases the outstanding balance. The original payment remains in the history. For a partial correction, reverse this payment and record the correct amount.|این کار تمام پرداخت را برمی‌گرداند و باقی‌مانده حساب را افزایش می‌دهد. پرداخت اصلی در تاریخچه می‌ماند. برای اصلاح قسمی، این پرداخت را برگردانید و مبلغ درست را ثبت کنید.|دا کار ټوله تادیه بېرته ګرځوي او پاتې بیلانس زیاتوي. اصلي تادیه په مخینه کې پاتې کېږي. د قسطي اصلاح لپاره دا تادیه بېرته وګرځوئ او سم مبلغ ثبت کړئ.
Reason for reversal *|دلیل برگشت پرداخت *|د تادیې د بېرته ګرځولو لامل *
Explain the correction…|دلیل اصلاح را توضیح دهید…|د سمون لامل ولیکئ…
Shop details|مشخصات دکان|د دوکان معلومات
These details appear on your receipts.|این مشخصات روی رسیدهای شما چاپ می‌شوند.|دا معلومات ستاسو په رسیدونو کې چاپېږي.
Shop name *|نام دکان *|د دوکان نوم *
Phone|شماره تماس|د اړیکې شمېره
Address|آدرس|پته
Interface / layout|زبان و چیدمان|ژبه او بڼه
Choose English, Farsi or Pashto. Your language is remembered in this browser.|انگلیسی، فارسی یا پشتو را انتخاب کنید. این مرورگر زبان انتخابی شما را نگه می‌دارد.|انګلیسي، فارسي یا پښتو وټاکئ. دا براوزر ستاسو ټاکلې ژبه ساتي.
English|English|English
A4|A4|A4
Receipt width|اندازه کاغذ رسید|د رسید د کاغذ اندازه
80 mm receipt|رسید ۸۰ میلی‌متری|۸۰ ملي متره رسید
Back up your shop|نسخه پشتیبان دکان|د دوکان شاتړ
Download your browser demo records as JSON. This is separate from the SQLite backup in the desktop version.|ریکاردهای این نسخه آزمایشی را به شکل JSON دانلود کنید. این فایل از پشتیبان SQLite نسخه دسکتاپ جدا است.|د دې ازمایښتي نسخې ریکارډونه د JSON په بڼه ډاونلوډ کړئ. دا فایل د ډېسکټاپ نسخې د SQLite له شاتړ څخه جلا دی.
Download JSON backup|دانلود پشتیبان JSON|د JSON شاتړ ډاونلوډ
Includes customers, measurements, orders, payments and settings.|شامل مشتریان، اندازه‌ها، سفارش‌ها، پرداخت‌ها و تنظیمات است.|پېرودونکي، اندازې، سپارښتنې، تادیات او تنظیمات پکې شامل دي.
Restore from a backup|بازیابی از نسخه پشتیبان|له شاتړ څخه بېرته راګرځول
Choose a JSON backup from this browser demo. Restoring replaces this browser’s demo records. A safety copy is kept in browser storage.|یک پشتیبان JSON از همین نسخه آزمایشی انتخاب کنید. بازیابی، ریکاردهای فعلی مرورگر را جایگزین می‌کند. یک نسخه احتیاطی در مرورگر نگه داشته می‌شود.|د همدې ازمایښتي نسخې د JSON شاتړ وټاکئ. بېرته راګرځول د براوزر اوسني ریکارډونه بدلوي. یوه احتیاطي کاپي په براوزر کې ساتل کېږي.
Choose demo JSON backup|انتخاب پشتیبان JSON نسخه آزمایشی|د ازمایښتي نسخې د JSON شاتړ ټاکل
I understand this replaces the shop’s current data.|می‌دانم که این کار معلومات فعلی دکان را جایگزین می‌کند.|پوهېږم چې دا کار د دوکان اوسني معلومات بدلوي.
Restore backup|بازیابی پشتیبان|شاتړ بېرته راګرځول
Restoring…|در حال بازیابی…|بېرته راګرځول کېږي…
Shop settings saved.|تنظیمات دکان ذخیره شد.|د دوکان تنظیمات خوندي شول.
Backup restored. A safety copy of the previous data was saved.|پشتیبان بازیابی شد. یک نسخه احتیاطی از معلومات قبلی ذخیره شد.|شاتړ بېرته راوګرځول شو. د پخوانیو معلوماتو احتیاطي کاپي خوندي شوه.
Customer saved.|مشتری ذخیره شد.|پېرودونکی خوندي شو.
Measurements saved. Existing orders stay unchanged.|اندازه‌ها ذخیره شدند. سفارش‌های قبلی تغییر نکردند.|اندازې خوندي شوې. پخوانۍ سپارښتنې بدل نه شوې.
Order created.|سفارش ثبت شد.|سپارښتنه ثبت شوه.
Payment recorded. Receipt ready.|پرداخت ثبت شد. رسید آماده است.|تادیه ثبت شوه. رسید چمتو دی.
Payment reversed. The original record is preserved.|پرداخت برگشت داده شد. ریکارد اصلی محفوظ است.|تادیه بېرته وګرځول شوه. اصلي ریکارډ خوندي دی.
Order status updated.|وضعیت سفارش تغییر کرد.|د سپارښتنې حالت بدل شو.
Could not save. Please try again.|ذخیره نشد. دوباره تلاش کنید.|خوندي نه شو. بیا هڅه وکړئ.
Opening your shop workspace…|در حال بازکردن محیط دکان…|د دوکان کاري چاپېریال پرانیستل کېږي…
Try again|تلاش دوباره|بیا هڅه
Close menu|بستن منو|مېنو تړل
Open menu|بازکردن منو|مېنو پرانیستل
Shalwar Kameez|پیراهن‌تنبان|کمیس پرتوګ
Dress|پیراهن زنانه|ښځینه کمیس
Suit|دریشی|درېشي
Alteration|ترمیم لباس|د جامو ترمیم
Chest|دور سینه|د سینې چاپېریال
Bust|دور سینه زنانه|د ښځینه سینې چاپېریال
Shoulder|عرض شانه|د اوږو پلنوالی
Sleeve length|طول آستین|د لستوڼي اوږدوالی
Shirt length|طول پیراهن|د کمیس اوږدوالی
Waist|دور کمر|د ملا چاپېریال
Hip|دور باسن|د کوناټو چاپېریال
Trouser length|طول تنبان|د پرتوګ اوږدوالی
Neck|دور گردن|د غاړې چاپېریال
Dress length|طول پیراهن زنانه|د ښځینه کمیس اوږدوالی
Jacket length|طول کت|د کوټ اوږدوالی
Length|طول|اوږدوالی
Please check this field and enter a valid value.|این فیلد را بررسی کنید و مقدار درست وارد کنید.|دا خانه وګورئ او سم ارزښت ولیکئ.
Enter a valid whole AFN amount or quantity.|مبلغ افغانی یا تعداد را به عدد صحیح و در محدوده مجاز وارد کنید.|د افغانیو مبلغ یا شمېر په بشپړ عدد او ټاکلي حد کې ولیکئ.
Invalid or too long text.|متن نامعتبر یا بیش از حد طولانی است.|متن ناسم یا ډېر اوږد دی.
Invalid clothing type.|نوع لباس نامعتبر است.|د جامو ډول ناسم دی.
Invalid measurement unit.|واحد اندازه‌گیری نامعتبر است.|د اندازې واحد ناسم دی.
Enter at least one measurement.|حداقل یک اندازه وارد کنید.|لږ تر لږه یوه اندازه ولیکئ.
Enter valid measurements greater than zero and up to 500.|اندازه‌های معتبر، بزرگ‌تر از صفر و حداکثر ۵۰۰ وارد کنید.|سمې اندازې ولیکئ چې له صفر څخه لوړې او تر ۵۰۰ پورې وي.
A profile name is required.|نام پروفایل الزامی است.|د پروفایل نوم اړین دی.
Record not found.|ریکارد پیدا نشد.|ریکارډ ونه موندل شو.
A customer name is required.|نام مشتری الزامی است.|د پېرودونکي نوم اړین دی.
Cannot change the profile’s customer.|مشتری این پروفایل را نمی‌توانید تغییر دهید.|د دې پروفایل پېرودونکی نه شئ بدلولای.
Invalid order status.|وضعیت سفارش نامعتبر است.|د سپارښتنې حالت ناسم دی.
Request already used with different details.|این درخواست قبلاً با جزئیات دیگری ثبت شده است.|دا غوښتنه مخکې له نورو جزئیاتو سره ثبت شوې ده.
Missing request identifier.|شناسه درخواست موجود نیست.|د غوښتنې پېژند نښه نشته.
Choose a valid delivery date on or after today.|تاریخ تحویل را امروز یا پس از امروز انتخاب کنید.|د سپارلو لپاره د نن یا تر نن وروسته سمه نېټه وټاکئ.
Add at least one clothing item.|حداقل یک قلم لباس اضافه کنید.|لږ تر لږه د جامو یو توکی زیات کړئ.
Measurement profile must match customer and clothing.|پروفایل اندازه باید با مشتری و نوع لباس مطابقت داشته باشد.|د اندازو پروفایل باید له پېرودونکي او د جامو له ډول سره برابر وي.
This payment is already reversed.|این پرداخت قبلاً برگشت داده شده است.|دا تادیه مخکې بېرته ګرځول شوې ده.
Explain the reason for reversal.|دلیل برگشت پرداخت را توضیح دهید.|د تادیې د بېرته ګرځولو لامل ولیکئ.
Invalid payment method.|روش پرداخت نامعتبر است.|د تادیې طریقه ناسمه ده.
Shop name is required.|نام دکان الزامی است.|د دوکان نوم اړین دی.
Invalid settings.|تنظیمات نامعتبر است.|تنظیمات ناسم دي.
Unsupported demo operation.|این عملیات در نسخه آزمایشی پشتیبانی نمی‌شود.|دا کړنه په ازمایښتي نسخه کې نه ملاتړ کېږي.
Choose a JSON backup from this browser demo. SQLite backups belong to the downloadable version.|پشتیبان JSON همین نسخه آزمایشی را انتخاب کنید. پشتیبان SQLite مربوط به نسخه دانلودشدنی است.|د همدې ازمایښتي نسخې د JSON شاتړ وټاکئ. د SQLite شاتړ د ډاونلوډ کېدونکې نسخې لپاره دی.
Invalid backup structure.|ساختار پشتیبان نامعتبر است.|د شاتړ جوړښت ناسم دی.
Invalid backup settings.|تنظیمات پشتیبان نامعتبر است.|د شاتړ تنظیمات ناسم دي.
Invalid customer.|معلومات مشتری نامعتبر است.|د پېرودونکي معلومات ناسم دي.
Missing profile customer.|مشتری پروفایل پیدا نشد.|د پروفایل پېرودونکی ونه موندل شو.
Missing order customer.|مشتری سفارش پیدا نشد.|د سپارښتنې پېرودونکی ونه موندل شو.
Order total mismatch.|مجموع سفارش با اقلام آن مطابقت ندارد.|د سپارښتنې ټول مبلغ له توکو سره برابر نه دی.
Missing item order.|سفارش مربوط به قلم پیدا نشد.|د توکي اړونده سپارښتنه ونه موندل شوه.
Invalid payment.|پرداخت نامعتبر است.|تادیه ناسمه ده.
Invalid reversal.|برگشت پرداخت نامعتبر است.|د تادیې بېرته ګرځول ناسم دي.
Invalid payment amount.|مبلغ پرداخت نامعتبر است.|د تادیې مبلغ ناسم دی.
Invalid balance.|بیلانس نامعتبر است.|بیلانس ناسم دی.
Demo backup must be smaller than 5 MB.|حجم پشتیبان نسخه آزمایشی باید کمتر از ۵ مگابایت باشد.|د ازمایښتي نسخې شاتړ باید له ۵ مېګابایټ څخه کوچنی وي.
Invalid JSON backup. Choose a valid demo backup file.|فایل JSON نامعتبر است. پشتیبان معتبر نسخه آزمایشی را انتخاب کنید.|د JSON فایل ناسم دی. د ازمایښتي نسخې سم شاتړ وټاکئ.
Browser storage is full or unavailable. Download a backup and check browser settings.|حافظه مرورگر پر یا غیرقابل‌دسترسی است. پشتیبان بگیرید و تنظیمات مرورگر را بررسی کنید.|د براوزر حافظه ډکه ده یا د لاسرسي وړ نه ده. شاتړ واخلئ او د براوزر تنظیمات وګورئ.
Choose file|انتخاب فایل|فایل ټاکل
No file selected|فایلی انتخاب نشده|فایل نه دی ټاکل شوی
Create your owner account|حساب مالک را بسازید|د مالک حساب جوړ کړئ
Create the only account for this shop. Signup closes automatically after this step.|تنها حساب این دکان را بسازید. پس از این مرحله ثبت‌نام خودکار بسته می‌شود.|د دې دوکان یوازینی حساب جوړ کړئ. له دې ګام وروسته نوملیکنه په خپله بندېږي.
Sign in with your username and password.|با نام کاربری و رمز عبور وارد شوید.|د خپل کارن نوم او پټنوم په کارولو ننوځئ.
Username|نام کاربری|کارن نوم
Password|رمز عبور|پټنوم
Confirm password|تأیید رمز عبور|پټنوم تایید کړئ
Server setup key|کلید راه‌اندازی سرور|د سرور د تنظیم کیلي
Please wait…|لطفاً صبر کنید…|مهرباني وکړئ انتظار وکړئ…
Sign up|ثبت‌نام|نوملیکنه
Sign in|ورود|ننوتل
Use a password with at least 10 characters.|رمز عبور حداقل ۱۰ نویسه داشته باشد.|لږ تر لږه د ۱۰ تورو پټنوم وکاروئ.
Only the registered owner can access this shop.|تنها مالک ثبت‌شده به این دکان دسترسی دارد.|یوازې ثبت شوی مالک دې دوکان ته لاسرسی لري.
Passwords do not match.|رمزهای عبور یکسان نیستند.|پټنومونه سره برابر نه دي.
Could not connect to the server.|اتصال به سرور ممکن نشد.|له سرور سره اړیکه ټینګه نه شوه.
Loading {page}…|در حال بارگذاری {page}…|{page} پورته کېږي…
Loading…|در حال بارگذاری…|د پورته کېدو په حال کې…
Opening your shop workspace…|در حال باز کردن فضای کاری دکان…|ستاسو د دوکان کاري ځای پرانیستل کېږي…
Shop workspace|فضای کاری دکان|د دوکان کاري ځای
Saved in your shop database|در پایگاه داده دکان ذخیره شد|ستاسو د دوکان په ډېټابېس کې خوندي شول
Username and password sign-in. One owner account only.|ورود با نام کاربری و رمز عبور. فقط یک حساب مالک.|د کارن نوم او پټنوم له لارې ننوتل. یوازې د یوه مالک حساب.
Download a complete SQLite backup of your shop records. Your account stays protected separately.|پشتیبان کامل SQLite از ریکاردهای دکان بگیرید. حساب شما جداگانه محافظت می‌شود.|د دوکان د ریکارډونو بشپړ SQLite شاتړ واخلئ. ستاسو حساب په جلا توګه خوندي پاتې کېږي.
Choose a SQLite backup. Restoring replaces shop records but keeps your owner account and password unchanged.|پشتیبان SQLite را انتخاب کنید. بازیابی ریکاردهای دکان را جایگزین می‌کند، اما حساب و رمز عبور مالک را تغییر نمی‌دهد.|د SQLite شاتړ وټاکئ. بېرته راوستل د دوکان ریکارډونه بدلوي، خو د مالک حساب او پټنوم نه بدلوي.
Choose SQLite backup|انتخاب پشتیبان SQLite|د SQLite شاتړ ټاکل
Please sign in to continue.|برای ادامه وارد شوید.|د دوام لپاره ننوځئ.
Your session changed. Reload and try again.|نشست شما تغییر کرده است. صفحه را تازه کنید و دوباره تلاش کنید.|ستاسو ناسته بدله شوې ده. پاڼه بیا پورته کړئ او بیا هڅه وکړئ.
Signup is closed. The owner account already exists.|ثبت‌نام بسته است. حساب مالک قبلاً ساخته شده است.|نوملیکنه بنده ده. د مالک حساب مخکې جوړ شوی دی.
A valid server setup key is required for first signup.|برای اولین ثبت‌نام، کلید معتبر راه‌اندازی سرور لازم است.|د لومړۍ نوملیکنې لپاره د سرور د تنظیم سمه کیلي اړینه ده.
Too many attempts. Try again in 15 minutes.|تلاش‌های بیش از حد. ۱۵ دقیقه بعد دوباره تلاش کنید.|هڅې ډېرې شوې. ۱۵ دقیقې وروسته بیا هڅه وکړئ.
Incorrect username or password.|نام کاربری یا رمز عبور نادرست است.|کارن نوم یا پټنوم ناسم دی.
`;
for(const line of rows.trim().split('\n')){const [key,fa,ps]=line.split('|');if(!key||!fa||!ps)throw new Error('Incomplete translation: '+key);translations[key]=[fa,ps]}
export function t(value:string|undefined,params:Record<string,string|number>={},lang:Language=current):string{
 if(value===undefined)return '';const key=value.trim().replace(/\s+/g,' ');const translated=lang==='en'?key:translations[key]?.[lang==='fa'?0:1]??key;
 return value.slice(0,value.length-value.trimStart().length)+translated.replace(/\{(\w+)\}/g,(_,k)=>String(params[k]??`{${k}}`))+value.slice(value.trimEnd().length);
}

const months={fa:['جنوری','فبروری','مارچ','اپریل','می','جون','جولای','اگست','سپتمبر','اکتوبر','نومبر','دسمبر'],ps:['جنوري','فبروري','مارچ','اپرېل','مې','جون','جولای','اګست','سپتمبر','اکتوبر','نومبر','دسمبر']};
const weekdays={fa:['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],ps:['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه']};
export function formatDate(value:string|Date,withWeekday=false){const d=value instanceof Date?value:new Date(value.includes('T')?value:value+'T12:00:00');if(Number.isNaN(d.getTime()))return '';if(current==='en')return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',...(withWeekday?{weekday:'short' as const}:{})});return (withWeekday?weekdays[current][d.getDay()]+'، ':'')+formatNumber(d.getDate())+' '+months[current][d.getMonth()]+' '+String(d.getFullYear()).replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)])}
export function formatTimestamp(value:string|Date){const d=value instanceof Date?value:new Date(value);const time=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});return formatDate(d)+'، '+(current==='en'?time:time.replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)]))}
