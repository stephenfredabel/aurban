import { useState, useRef, useCallback } from 'react';
import { useTranslation }   from 'react-i18next';
import { Camera, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { useOnboarding }    from '../../../hooks/useOnboarding.js';
import { useCountry }       from '../../../hooks/useCountry.js';
import { useImageCompress } from '../../../hooks/useImageCompress.js';
import StepWrapper          from '../StepWrapper.jsx';
import Button               from '../../ui/Button.jsx';
import Select               from '../../ui/Select.jsx';
import FileUpload           from '../../ui/FileUpload.jsx';
import Input                from '../../ui/Input.jsx';

export default function Step04_Identity() {
  const { t }                          = useTranslation();
  const { updateStep, nextStep, data } = useOnboarding();
  const { idTypes }                    = useCountry();
  const { compress }                   = useImageCompress();

  const saved = data.identity || {};

  const [idType,   setIdType]   = useState(saved.idType   || '');
  const [idNumber, setIdNumber] = useState(saved.idNumber || '');
  const [docFront, setDocFront] = useState(saved.docFront || null);
  const [docBack,  setDocBack]  = useState(saved.docBack  || null);
  const [selfie,   setSelfie]   = useState(saved.selfie   || null);
  const [errors,   setErrors]   = useState({});
  const selfieInputRef          = useRef(null);
  const [usingSelfieCamera, setUsingSelfieCamera] = useState(false);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const idOptions = idTypes.map((t) => ({ value: t.value, label: t.label }));

  const validate = () => {
    const e = {};
    if (!idType)          e.idType   = 'Please select your ID type';
    if (!idNumber.trim()) e.idNumber = 'Please enter your ID number';
    if (!docFront)        e.docFront = 'Please upload the front of your ID';
    if (!selfie)          e.selfie   = 'Please take or upload a selfie';
    return e;
  };

  // Open device camera for selfie
  const openCamera = useCallback(async () => {
    setUsingSelfieCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setUsingSelfieCamera(false);
      setErrors((prev) => ({ ...prev, selfie: t('errors.locationDenied').replace('Location', 'Camera') }));
    }
  }, [t]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file       = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      const compressed = await compress(file);
      const reader     = new FileReader();
      reader.onload    = (e) => {
        setSelfie({ file: compressed, preview: e.target.result, name: 'selfie.jpg', size: compressed.size });
        setErrors((prev) => ({ ...prev, selfie: null }));
      };
      reader.readAsDataURL(compressed);
    }, 'image/jpeg', 0.85);

    // Stop stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setUsingSelfieCamera(false);
  }, [compress]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setUsingSelfieCamera(false);
  };

  const handleSkip = () => {
    updateStep('identity', { skipped: true });
    nextStep();
  };

  const handleContinue = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateStep('identity', { idType, idNumber, docFront, docBack, selfie, verified: false });
    nextStep();
  };

  return (
    <StepWrapper
      title="Verify your identity"
      subtitle="Your data is encrypted and never shown publicly. Verification builds trust with clients."
      tooltip="We verify your identity to protect everyone on the platform. Your ID number is never shown on your profile."
      onSkip={handleSkip}
    >

      {/* Trust badge */}
      <div className="flex items-center gap-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
        <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-emerald-800">Bank-level encryption</p>
          <p className="text-[11px] text-emerald-600 font-body">Your documents are encrypted at rest and never shared with third parties.</p>
        </div>
      </div>

      {/* ID Type */}
      <Select
        label="Government ID Type"
        value={idType}
        onChange={(v) => { setIdType(v); setErrors((p) => ({ ...p, idType: null })); }}
        options={idOptions}
        placeholder="Select ID type..."
        error={errors.idType}
        required
      />

      {/* ID Number */}
      {idType && (
        <Input
          label="ID Number"
          placeholder="Enter your ID number"
          value={idNumber}
          onChange={(e) => { setIdNumber(e.target.value); setErrors((p) => ({ ...p, idNumber: null })); }}
          error={errors.idNumber}
          required
          hint="Enter exactly as printed on your document"
          autoComplete="off"
        />
      )}

      {/* Document uploads */}
      {idType && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FileUpload
            label="ID Document — Front"
            hint="Clear photo or scan"
            value={docFront}
            onChange={setDocFront}
            error={errors.docFront}
            accept={['image/jpeg','image/png','application/pdf']}
            maxMB={10}
            required
          />
          <FileUpload
            label="ID Document — Back"
            hint="Required for cards with info on back"
            value={docBack}
            onChange={setDocBack}
            accept={['image/jpeg','image/png','application/pdf']}
            maxMB={10}
            optional
          />
        </div>
      )}

      {/* Selfie section */}
      <div>
        <p className="mb-2 label-sm">Selfie Photo</p>
        <p className="mb-3 text-xs text-gray-400 font-body">
          Look directly at the camera in good lighting. Remove glasses if possible.
        </p>

        {!usingSelfieCamera && !selfie && (
          <div className="grid grid-cols-2 gap-3">
            {/* Camera button */}
            <button
              type="button"
              onClick={openCamera}
              className="flex flex-col items-center gap-2 p-4 transition-all border-2 border-gray-200 border-dashed rounded-2xl hover:border-brand-gold hover:bg-brand-gold/3 group"
            >
              <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-xl bg-brand-gold/10 group-hover:bg-brand-gold/20">
                <Camera size={18} className="text-brand-gold-dark" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-brand-charcoal-dark">Use Camera</p>
                <p className="text-[11px] text-gray-400">Recommended</p>
              </div>
            </button>

            {/* Upload button */}
            <label
              htmlFor="selfie-upload"
              className="flex flex-col items-center gap-2 p-4 transition-all border-2 border-gray-200 border-dashed cursor-pointer rounded-2xl hover:border-brand-gold hover:bg-brand-gold/3 group"
            >
              <div className="flex items-center justify-center w-10 h-10 transition-colors bg-gray-100 rounded-xl group-hover:bg-gray-200">
                <Upload size={18} className="text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-brand-charcoal-dark">Upload Photo</p>
                <p className="text-[11px] text-gray-400">JPG or PNG</p>
              </div>
              <input
                id="selfie-upload"
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                ref={selfieInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const compressed = await compress(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setSelfie({ file: compressed, preview: ev.target.result, name: file.name, size: compressed.size });
                    setErrors((p) => ({ ...p, selfie: null }));
                  };
                  reader.readAsDataURL(compressed);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        )}

        {/* Live camera view */}
        {usingSelfieCamera && (
          <div className="overflow-hidden bg-black border-2 rounded-2xl border-brand-gold">
            <video ref={videoRef} playsInline muted className="w-full rounded-t-2xl" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3 p-3 bg-black">
              <button type="button" onClick={capturePhoto}
                className="flex-1 py-3 text-sm font-bold bg-brand-gold text-brand-charcoal-dark rounded-xl">
                📸 Capture
              </button>
              <button type="button" onClick={stopCamera}
                className="px-4 py-3 text-sm font-medium text-white bg-white/10 rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Selfie preview */}
        {selfie && (
          <div className="flex items-center gap-3 p-3 border bg-emerald-50 border-emerald-200 rounded-2xl">
            <img
              src={selfie.preview}
              alt="Your selfie"
              className="object-cover border-2 w-14 h-14 rounded-xl border-emerald-300"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">Selfie captured</p>
              <p className="text-xs text-emerald-600">Looking good! We'll match this to your ID.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelfie(null)}
              className="text-xs text-gray-400 underline transition-colors hover:text-red-500"
            >
              Retake
            </button>
          </div>
        )}

        {errors.selfie && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={12} />
            {errors.selfie}
          </p>
        )}
      </div>

      <Button fullWidth size="lg" onClick={handleContinue}>
        Continue
      </Button>
    </StepWrapper>
  );
}