import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type KycStep = "intro" | "personal" | "document" | "selfie" | "review" | "submitted";

interface DocFile {
  file: File;
  preview: string;
}

const DOC_TYPES = [
  { id: "nin", label: "NIN Slip", icon: FileText },
  { id: "passport", label: "Int'l Passport", icon: FileText },
  { id: "drivers_license", label: "Driver's License", icon: FileText },
  { id: "voters_card", label: "Voter's Card", icon: FileText },
];

const KycPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<KycStep>(
    user?.kyc_status === "pending" ? "submitted" : user?.kyc_status === "verified" ? "submitted" : "intro"
  );
  const [bvn, setBvn] = useState("");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [dob, setDob] = useState("");
  const [docType, setDocType] = useState("");
  const [docFront, setDocFront] = useState<DocFile | null>(null);
  const [docBack, setDocBack] = useState<DocFile | null>(null);
  const [selfie, setSelfie] = useState<DocFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const stepIndex = ["intro", "personal", "document", "selfie", "review", "submitted"].indexOf(step);
  const progress = Math.round((stepIndex / 5) * 100);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: DocFile | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    setError("");
    setter({ file, preview: URL.createObjectURL(file) });
  };

  const handleSubmit = async () => {
    if (!docFront || !selfie) return;
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("bvn", bvn);
      formData.append("full_name", fullName);
      formData.append("date_of_birth", dob);
      formData.append("document_type", docType);
      formData.append("document_front", docFront.file);
      if (docBack) formData.append("document_back", docBack.file);
      formData.append("selfie", selfie.file);

      await api.post("/kyc/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStep("submitted");
    } catch (err: any) {
      setError(err.response?.data?.message || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedPersonal = bvn.length === 11 && fullName.trim().length > 2 && dob;
  const canProceedDocument = docType && docFront;
  const canProceedSelfie = !!selfie;

  return (
    <div className="min-h-screen bg-background safe-bottom pb-10">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">KYC Verification</h1>
      </div>

      {step !== "intro" && step !== "submitted" && (
        <div className="px-5 mb-6">
          <Progress value={progress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-1.5">Step {stepIndex} of 5</p>
        </div>
      )}

      {error && (
        <div className="mx-5 mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* INTRO */}
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5">
            <div className="flex flex-col items-center text-center mb-8 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Verify Your Identity</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Complete KYC to unlock full trading limits, faster payouts, and enhanced security.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { step: "1", text: "Personal details & BVN" },
                { step: "2", text: "Upload a valid ID document" },
                { step: "3", text: "Take a selfie for verification" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {item.step}
                  </div>
                  <p className="text-sm text-foreground font-medium">{item.text}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => setStep("personal")} className="w-full h-12 rounded-xl font-semibold">
              Start Verification <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* PERSONAL DETAILS */}
        {step === "personal" && (
          <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5 space-y-4">
            <h2 className="text-base font-bold text-foreground">Personal Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Full Name (as on ID)</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-12 rounded-xl bg-card border-border/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">BVN (11 digits)</label>
                <Input value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="22200000000" inputMode="numeric" className="h-12 rounded-xl bg-card border-border/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Date of Birth</label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-12 rounded-xl bg-card border-border/30" />
              </div>
            </div>
            <Button onClick={() => setStep("document")} disabled={!canProceedPersonal} className="w-full h-12 rounded-xl font-semibold mt-4">
              Continue <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* DOCUMENT UPLOAD */}
        {step === "document" && (
          <motion.div key="document" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5 space-y-4">
            <h2 className="text-base font-bold text-foreground">Upload ID Document</h2>

            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDocType(d.id)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    docType === d.id
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-card border-border/30 text-foreground"
                  }`}
                >
                  <d.icon size={16} className="mb-1" />
                  <p className="text-xs font-semibold">{d.label}</p>
                </button>
              ))}
            </div>

            {/* Front */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Front Side *</label>
              <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setDocFront)} />
              {docFront ? (
                <div className="relative rounded-xl overflow-hidden border border-border/30">
                  <img src={docFront.preview} alt="Front" className="w-full h-40 object-cover" />
                  <button onClick={() => setDocFront(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                    <X size={14} className="text-foreground" />
                  </button>
                </div>
              ) : (
                <button onClick={() => frontRef.current?.click()} className="w-full h-32 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:bg-secondary/30 transition-colors">
                  <Upload size={20} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Tap to upload</p>
                </button>
              )}
            </div>

            {/* Back */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Back Side (optional)</label>
              <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, setDocBack)} />
              {docBack ? (
                <div className="relative rounded-xl overflow-hidden border border-border/30">
                  <img src={docBack.preview} alt="Back" className="w-full h-40 object-cover" />
                  <button onClick={() => setDocBack(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                    <X size={14} className="text-foreground" />
                  </button>
                </div>
              ) : (
                <button onClick={() => backRef.current?.click()} className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 hover:bg-secondary/30 transition-colors">
                  <Upload size={16} className="text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Tap to upload</p>
                </button>
              )}
            </div>

            <Button onClick={() => setStep("selfie")} disabled={!canProceedDocument} className="w-full h-12 rounded-xl font-semibold">
              Continue <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* SELFIE */}
        {step === "selfie" && (
          <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5 space-y-4">
            <h2 className="text-base font-bold text-foreground">Take a Selfie</h2>
            <p className="text-sm text-muted-foreground">Take a clear photo of your face. Make sure your face is well-lit and fully visible.</p>

            <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileSelect(e, setSelfie)} />

            {selfie ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/30">
                <img src={selfie.preview} alt="Selfie" className="w-full h-64 object-cover" />
                <button onClick={() => setSelfie(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                  <X size={14} className="text-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={() => selfieRef.current?.click()} className="w-full h-52 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 hover:bg-secondary/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera size={24} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Tap to take selfie</p>
              </button>
            )}

            <Button onClick={() => setStep("review")} disabled={!canProceedSelfie} className="w-full h-12 rounded-xl font-semibold">
              Review &amp; Submit <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* REVIEW */}
        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5 space-y-4">
            <h2 className="text-base font-bold text-foreground">Review Your Submission</h2>

            <div className="rounded-xl bg-card border border-border/30 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BVN</span>
                <span className="text-foreground font-medium">{bvn.slice(0, 4)}****{bvn.slice(-3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DOB</span>
                <span className="text-foreground font-medium">{dob}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Document</span>
                <span className="text-foreground font-medium capitalize">{docType.replace("_", " ")}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {docFront && <img src={docFront.preview} alt="Front" className="rounded-lg h-20 w-full object-cover border border-border/30" />}
              {docBack && <img src={docBack.preview} alt="Back" className="rounded-lg h-20 w-full object-cover border border-border/30" />}
              {selfie && <img src={selfie.preview} alt="Selfie" className="rounded-lg h-20 w-full object-cover border border-border/30" />}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("personal")} className="flex-1 h-12 rounded-xl font-semibold">
                Edit
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 rounded-xl font-semibold">
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* SUBMITTED */}
        {step === "submitted" && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 flex flex-col items-center text-center mt-10">
            {user?.kyc_status === "verified" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Identity Verified</h2>
                <p className="text-sm text-muted-foreground max-w-xs mb-8">Your identity has been verified. You have full access to all features.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
                  <Clock size={32} className="text-warning" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Under Review</h2>
                <p className="text-sm text-muted-foreground max-w-xs mb-8">
                  Your documents are being reviewed. This usually takes 1–24 hours. We'll notify you once approved.
                </p>
              </>
            )}
            <Button onClick={() => navigate("/profile")} variant="secondary" className="w-full h-12 rounded-xl font-semibold">
              Back to Profile
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KycPage;
