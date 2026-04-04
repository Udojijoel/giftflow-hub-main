import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Check, ChevronRight, Gift } from "lucide-react";
import { rateService, type CardRate } from "@/services/rateService";
import { tradeService } from "@/services/tradeService";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import ConnectionError from "@/components/shared/ConnectionError";

const cardTypes = ["Physical Card", "eCode", "Receipt"];
const denominations = ["$25", "$50", "$100", "$200", "$500", "Other"];

const SellCard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDenom, setSelectedDenom] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [ecode, setEcode] = useState("");
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Rates from API
  const [allRates, setAllRates] = useState<CardRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [rateError, setRateError] = useState("");

  useEffect(() => {
    const fetchRates = async () => {
      setLoadingRates(true);
      setRateError("");
      try {
        const res = await rateService.getAll();
        setAllRates(res.data);
      } catch (err: any) {
        setRateError(err.message || "Failed to load rates");
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  // Derive unique brands from rates
  const cardBrands = [...new Set(allRates.map((r) => r.brand_name))];

  // Find matching rate
  const matchingRate = allRates.find(
    (r) =>
      r.brand_name === selectedBrand &&
      r.card_type.toLowerCase() === selectedType.toLowerCase() &&
      r.denomination === selectedDenom
  );
  const ratePerDollar = matchingRate?.rate_per_dollar || 0;
  const denomValue = parseInt(selectedDenom.replace("$", "")) || 0;
  const total = denomValue * parseInt(quantity || "0") * ratePerDollar;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("card_brand_id", matchingRate?.card_brand_id || "");
      formData.append("card_type", selectedType);
      formData.append("denomination", selectedDenom);
      formData.append("quantity", quantity);
      if (ecode) formData.append("ecode", ecode);
      if (cardImage) formData.append("card_image", cardImage);

      await tradeService.submit(formData);
      navigate("/trade-submitted");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit trade. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCardImage(e.target.files[0]);
  };

  const stepTitles: Record<number, string> = {
    1: "Select Gift Card",
    2: "Card Type",
    3: "Denomination",
    4: "Quantity",
    5: "Rate Preview",
    6: "Upload Card",
    7: "Review Trade",
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{stepTitles[step]}</h1>
          <p className="text-xs text-muted-foreground">Step {step} of 7</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="h-1 rounded-full bg-secondary">
          <motion.div animate={{ width: `${(step / 7) * 100}%` }} className="h-full rounded-full bg-primary" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-5">

          {/* Step 1: Select Brand */}
          {step === 1 && (
            loadingRates ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : rateError ? (
              <ConnectionError message={rateError} onRetry={() => window.location.reload()} />
            ) : cardBrands.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5">
                {cardBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => { setSelectedBrand(brand); setStep(2); }}
                    className={`h-20 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center ${
                      selectedBrand === brand
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-card border-border/30 text-foreground hover:border-primary/30"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={Gift} title="No gift cards available" description="Card rates haven't been set up yet. Check back later." />
            )
          )}

          {/* Step 2: Card Type */}
          {step === 2 && (
            <div className="space-y-3">
              {cardTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { setSelectedType(type); setStep(3); }}
                  className={`w-full p-4 rounded-xl border text-left font-semibold flex items-center justify-between transition-all ${
                    selectedType === type
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-card border-border/30 text-foreground hover:border-primary/30"
                  }`}
                >
                  {type}
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Denomination */}
          {step === 3 && (
            <div className="grid grid-cols-3 gap-3">
              {denominations.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDenom(d); setStep(4); }}
                  className={`h-16 rounded-xl border text-base font-bold transition-all ${
                    selectedDenom === d
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-card border-border/30 text-foreground hover:border-primary/30"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Quantity */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))} className="w-14 h-14 rounded-2xl bg-secondary text-2xl font-bold text-foreground">−</button>
                <span className="text-5xl font-extrabold text-foreground w-16 text-center">{quantity}</span>
                <button onClick={() => setQuantity(String(parseInt(quantity) + 1))} className="w-14 h-14 rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">+</button>
              </div>
              <button onClick={() => setStep(5)} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold">Continue</button>
            </div>
          )}

          {/* Step 5: Rate Preview */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Card</span>
                  <span className="font-semibold text-foreground">{selectedBrand}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold text-foreground">{selectedType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Denomination</span>
                  <span className="font-semibold text-foreground">{selectedDenom} × {quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold text-primary">
                    {ratePerDollar > 0 ? `₦${ratePerDollar}/$` : "Rate unavailable"}
                  </span>
                </div>
                <div className="border-t border-border/30 pt-4 flex justify-between">
                  <span className="text-muted-foreground font-medium">You'll receive</span>
                  <span className="text-2xl font-extrabold text-primary">₦{total.toLocaleString()}</span>
                </div>
              </div>
              {ratePerDollar === 0 && (
                <p className="text-sm text-warning text-center">No rate found for this combination. The admin may not have set it yet.</p>
              )}
              <button onClick={() => setStep(6)} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold" disabled={ratePerDollar === 0}>
                Continue
              </button>
            </div>
          )}

          {/* Step 6: Upload */}
          {step === 6 && (
            <div className="space-y-4">
              {selectedType === "eCode" ? (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Enter eCode</label>
                  <input value={ecode} onChange={(e) => setEcode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" className="w-full h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-border/50 rounded-2xl p-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload size={24} className="text-primary" />
                  </div>
                  {cardImage ? (
                    <p className="text-sm text-primary font-medium">{cardImage.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">Drag & drop your card image here, or tap to upload</p>
                  )}
                  <div className="flex gap-3">
                    <label className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                      <Upload size={14} /> Browse
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <label className="px-4 py-2 rounded-xl bg-primary/15 text-sm font-medium text-primary flex items-center gap-1.5 cursor-pointer">
                      <Camera size={14} /> Camera
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
              <button
                onClick={() => setStep(7)}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold"
                disabled={selectedType === "eCode" ? !ecode.trim() : !cardImage}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-3">
                {[
                  ["Card Brand", selectedBrand],
                  ["Card Type", selectedType],
                  ["Denomination", `${selectedDenom} × ${quantity}`],
                  ["Rate", ratePerDollar > 0 ? `₦${ratePerDollar}/$` : "N/A"],
                  ["Total Payout", `₦${total.toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Submitting...</span>
                ) : (
                  <><Check size={18} /> Submit Trade</>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SellCard;
