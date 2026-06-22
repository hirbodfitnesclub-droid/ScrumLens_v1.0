import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, DatabaseZap, ShieldAlert, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { parseCsv } from "./parseCsv";
import { normalizeCsvRows } from "./normalize";
import { reconcileTasks, ReconciliationResult } from "./reconcile";
import { fetchTasks } from "../../data/tasks";
import { fetchStateGroupMaps } from "../../data/settings";
import { persistImport } from "./persistImport";
import ReconciliationSummary from "./ReconciliationSummary";
import { useQueryClient } from "@tanstack/react-query";

export default function ImportWizard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [step, setStep] = useState<"idle" | "evaluating" | "preview" | "syncing" | "success">("idle");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const processFile = async (file: File) => {
    if (!file) return;
    setStep("evaluating");
    setFileName(file.name);
    setErrorMessage("");

    try {
      // 1. Read file to text
      const reader = new FileReader();
      const textContent = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string || "");
        reader.onerror = (e) => reject(new Error("خطا در خواندن فایل فیزیکی"));
        reader.readAsText(file, "UTF-8");
      });

      // 2. Parse CSV
      const parsed = await parseCsv(textContent);
      if (parsed.errors && parsed.errors.length > 0 && parsed.rows.length === 0) {
        throw new Error(parsed.errors[0]);
      }

      const rows = parsed.rows;
      setRowCount(rows.length);

      // 3. Fetch current mappings and items inside database to perform reconciliation
      const existingDbTasks = await fetchTasks();
      const stateMappings = await fetchStateGroupMaps();

      // Convert mappings array to Record
      const mappingsRecord = stateMappings.reduce((acc, curr) => {
        acc[curr.state_name] = curr.state_group;
        return acc;
      }, {} as Record<string, any>);

      // 4. Normalize and reconcile
      const normalized = normalizeCsvRows(rows, mappingsRecord);
      const output = reconcileTasks(normalized, existingDbTasks);

      setReconciliation(output);
      setStep("preview");

    } catch (err: any) {
      setErrorMessage(err?.message || "پردازش فایل ناموفق بود. لطفاً قالب فایل را بررسی کنید.");
      setStep("idle");
    }
  };

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const executeDbSync = async () => {
    if (!reconciliation) return;
    setStep("syncing");
    setErrorMessage("");

    try {
      await persistImport(fileName, reconciliation, rowCount);
      
      // Invalidate queries to reload all analytics dashboards
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["imports"] });

      setStep("success");
    } catch (err: any) {
      setErrorMessage(err?.message || "خطا در همگام‌سازی ابری با پایگاه داده رخ داده است.");
      setStep("preview");
    }
  };

  const resetWizard = () => {
    setStep("idle");
    setFileName("");
    setReconciliation(null);
    setRowCount(0);
    setErrorMessage("");
  };

  return (
    <div className="w-full text-right">
      <AnimatePresence mode="wait">
        
        {/* Step: File Upload Drag Drop */}
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 select-none ${
                dragActive 
                  ? "border-ink bg-accent/20 scale-[1.01]" 
                  : "border-muted-light/80 bg-white hover:border-ink hover:bg-muted-light/10"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileSelect}
              />
              
              <div className="h-16 w-16 bg-muted-light/20 rounded-2xl flex items-center justify-center text-muted-text">
                <Upload className="h-8 w-8 text-ink" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-ink">درون‌ریزی فایل خروجی CSV</h3>
                <p className="text-xs text-muted-text mt-1.5 leading-relaxed font-semibold">
                  فایل CSV مربوط به بورد کارهای خود را از Plane.so دانلود کرده و به اینجا بکشید یا برای انتخاب کلیک کنید.
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 max-w-sm mt-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step: Processor Animating Loader */}
        {step === "evaluating" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white border border-muted-light/40 rounded-3xl"
          >
            <Loader2 className="h-12 w-12 animate-spin text-ink" />
            <div>
              <h3 className="text-base font-extrabold text-ink">در حال تجزیه و تحلیل ردیف‌ها...</h3>
              <p className="text-xs text-muted-text font-semibold mt-1">
                سیستم در حال ارزیابی کدهای یکتا، نقش‌های پرسونل و متصل کردن فعالیت‌ها به وضعیت‌ها است.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step: Diff Reconciliation Preview Results */}
        {step === "preview" && reconciliation && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-muted-light/40 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent/20 text-ink rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-ink">پیش‌نمایش تغییرات و آشتی داده‌ها</h3>
                    <p className="text-xs text-muted-text font-semibold mt-0.5">نام فایل بارگذاری شده: {fileName} ({rowCount} ردیف خام)</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetWizard}>
                    <span>بی‌خیال</span>
                  </Button>
                  <Button variant="accent" size="sm" onClick={executeDbSync} className="gap-1.5">
                    <DatabaseZap className="h-4 w-4" />
                    <span>تأیید و اعمال در پایگاه داده</span>
                  </Button>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Collapsible details accordion */}
              <ReconciliationSummary result={reconciliation} />
            </Card>
          </motion.div>
        )}

        {/* Step: Syncing Loader */}
        {step === "syncing" && (
          <motion.div
            key="syncing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-white border border-muted-light/40 rounded-3xl"
          >
            <Loader2 className="h-12 w-12 animate-spin text-ink" />
            <div>
              <h3 className="text-base font-extrabold text-ink">در حال همگام‌سازی پایگاه داده...</h3>
              <p className="text-xs text-muted-text font-semibold mt-1">هیچ تغییری بازگشت داده نخواهد شد. در حال نوشتن تراکنش‌ها به اتمام ساختار.</p>
            </div>
          </motion.div>
        )}

        {/* Step: Success screen feedback */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16 text-center gap-6 bg-white border border-muted-light/40 rounded-3xl p-8"
          >
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-black text-ink">همگام‌سازی با موفقیت انجام شد!</h3>
              <p className="text-xs leading-relaxed text-muted-text font-semibold">
                اطلاعات پروژه‌ها، نام پرسونل آژانس، وضعیت کارهای اسپرینت فرستاده‌شده و تاریخچه کامنت‌ها با موفقیت در دیتابیس هوشمند همگام و ذخیره شد.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={resetWizard} variant="outline" size="sm">
                <span>بارگذاری فایل جدید</span>
              </Button>
              <Button onClick={() => window.location.href = "/"} variant="accent" size="sm" className="gap-1">
                <Sparkles className="h-4 w-4" />
                <span>مشاهده داشبورد تحلیلی</span>
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
