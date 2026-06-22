import AppShell from "../components/layout/AppShell";
import ImportWizard from "../features/ingestion/ImportWizard";
import ImportHistory from "../features/ingestion/ImportHistory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { UploadCloud, History, HelpCircle } from "lucide-react";

export default function ImportPage() {
  return (
    <AppShell>
      <div className="space-y-8 text-right selection:bg-accent selection:text-ink">
        {/* Banner Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-ink">درون‌ریزی فایل بورد Plane</h1>
          <p className="text-sm text-muted-text font-semibold">
            فایل بورد اسپرینت خود را بارگذاری کنید تا هوش مصنوعی ScrumLens داده‌ها را تحلیل و با دیتابیس همگام‌سازی کند.
          </p>
        </div>

        {/* Two column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Active Wizard (Left Side 2-folds width) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-muted-light/30 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-ink" />
                  <CardTitle>سامانه بارگذاری همگام‌سازی</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ImportWizard />
              </CardContent>
            </Card>

            {/* Explanatory banner */}
            <div className="bg-amber-50/50 rounded-3xl p-5 border border-amber-200/50 flex gap-4 text-xs font-semibold leading-relaxed text-amber-900">
              <HelpCircle className="h-5 w-5 shrink-0 text-amber-700" />
              <div className="space-y-1">
                <p className="font-bold">راهنمای بارگذاری خروجی Plane:</p>
                <p>
                  ۱. وارد سیستم مدیریت کارهای Plane.so خود شوید.<br />
                  ۲. فیلترهای دلخواه یا کل بورد اسپرینت جاری را اعمال کرده و دکمه Export as CSV را بزنید.<br />
                  ۳. فایل بارگیری شده را بدون تغییر تایتل یا رمزگذاری در این ابزار قرار دهید. کارها شناسایی، نام‌های کارشناسان نرمال‌سازی و تفاوت‌های فیلدهای وضعیت برای حسابرسی مالی ذخیره می‌شود.
                </p>
              </div>
            </div>
          </div>

          {/* Past History Lists (Right Side 1-fold width) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-muted-light/30 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-text" />
                  <CardTitle className="text-sm">تاریخچه لودهای گذشته</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ImportHistory />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
