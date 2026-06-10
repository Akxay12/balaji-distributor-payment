import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useParams } from "react-router-dom";

import { BASE_URL } from "./config";

import {
  ArrowLeft,
  Building2,
  Check,
  HelpCircle,
  Loader2,
  MoreVertical,
  ShieldCheck,
  XCircle,
  Clock,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';



type PaymentState = 'idle' | 'processing' | 'success' | 'failed' | 'expired';

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Play a nice bright double chime (UPI-style)
    playTone(987.77, 'sine', 0, 0.5);    // B5
    playTone(1318.51, 'sine', 0.15, 0.8);  // E6

    // Quick haptic feedback if supported (works on Android devices)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 100, 150]);
    }
  } catch (error) {
    console.log('Audio error:', error);
  }
};

const playFailedSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Deep error buzz
    playTone(150, 'sawtooth', 0, 0.4);
    playTone(100, 'sawtooth', 0.2, 0.4);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (error) {
    console.log('Audio error:', error);
  }
};

export default function App() {


    const { id } = useParams();

    const [session, setSession] =
      useState<any>(null);

  const [status, setStatus] = useState<PaymentState>('idle');
  const [timeLeft, setTimeLeft] = useState(300); // 5 min

const [errorMessage,
       setErrorMessage] =
       useState("");



const PAYMENT_AMOUNT =
  session?.totalAmount
    ? Number(
        session.totalAmount
      ).toLocaleString()
    : "0";


useEffect(() => {

  const loadSession = async () => {

    try {

      const response =
        await fetch(
          `${BASE_URL}/checkout-session/public/${id}`
        );

      const text =
        await response.text();

      const data =
        text
          ? JSON.parse(text)
          : null;

      if (!response.ok) {

        setErrorMessage(
          data?.message ||
          "Unable to load payment session."
        );

        setStatus("failed");

        return;
      }

      setSession(data);

      if (data?.expiresAt) {

    console.log("Backend expiresAt:", data.expiresAt);

    const expires =
      new Date(data.expiresAt).getTime();

    const now = Date.now();

    console.log("Expires:", expires);
    console.log("Now:", now);
    console.log("Difference:", expires - now);

    setTimeLeft(
      Math.max(
        0,
        Math.floor((expires - now) / 1000)
      )
    );
}

    } catch (err) {

      console.error(err);

      setErrorMessage(
        "Unable to connect to server."
      );

      setStatus("failed");
    }
  };

  loadSession();

}, [id]);



//polling
useEffect(() => {

   const interval =
      setInterval(async () => {

         if (
            status === "success" ||
            status === "failed" ||
            status === "expired"
         ) {
            return;
         }

         try {

            const response =
               await fetch(
                  `${BASE_URL}/checkout-session/public/${id}`
               );

            const text =
               await response.text();

            const data =
               text
                  ? JSON.parse(text)
                  : null;

            if (!response.ok) {
               return;
            }

            setSession(data);

            if (
               data.paymentStatus === "EXPIRED"
            ) {

               setStatus("expired");

            }
            else if (
               data.paymentStatus === "PAID"
            ) {

               playSuccessSound();

               fireConfetti();

               setStatus("success");

            }
            else if (
               data.paymentStatus === "FAILED"
            ) {

               playFailedSound();

               setErrorMessage(
                  "Payment failed."
               );

               setStatus("failed");
            }

         }
         catch (err) {

            console.error(
               "Polling failed:",
               err
            );
         }

      }, 2000);   // <-- ye yahin rehna chahiye

   return () => {
      clearInterval(interval);
   };

}, [id, status]);




  // Timer logic
  useEffect(() => {
    if (status !== 'idle' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
       if (prev <= 1) {

          return 0;
       }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const fireConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#12B76A', '#039855', '#D1FADF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#12B76A', '#039855', '#D1FADF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };





   const handlePay = async () => {
      if (status !== 'idle') return;
      setStatus('processing');

      // Simulate network delay and payment processing
      try {

        const response =
          await fetch(

            `${BASE_URL}/checkout-session/public/${id}/pay`,

            {
              method: "POST"
            }
          );

        if (!response.ok) {

           const errorText =
              await response.text();

           const errorData =
              errorText
                 ? JSON.parse(errorText)
                 : null;

           setErrorMessage(
              errorData?.message ||
              "Payment failed."
           );

           playFailedSound();

           setStatus("failed");

           return;
        }

        const successText =
          await response.text();

        const data =
          successText
            ? JSON.parse(successText)
            : null;



        setSession(data);

        if (
          data.paymentStatus ===
          "PAID"
        ) {

          playSuccessSound();

          fireConfetti();

          setStatus(
            "success"
          );

        }

        else if (
          data.paymentStatus ===
          "FAILED"
        ) {

          setSession(data);

          playFailedSound();

          setStatus(
            "failed"
          );

        }

        else if (
          data.paymentStatus ===
          "EXPIRED"
        ) {

          setStatus(
            "expired"
          );

        }
         else if (
            data.paymentStatus === "PENDING"
         ) {

            setSession(data);

            setStatus("idle");
         }


      } catch (error) {

           console.error(
              "Payment error:",
              error
           );

           setErrorMessage(
              "Unable to connect to server."
           );

           playFailedSound();

           setStatus("failed");
        }


    };







  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };




  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center sm:p-6 font-sans text-neutral-900">
      {/* Mobile Device Simulation Container */}
      <div className="relative w-full h-[100dvh] sm:h-[844px] sm:max-w-[390px] bg-white sm:rounded-[40px] sm:shadow-2xl overflow-hidden flex flex-col border border-neutral-200">

        {/* Content Area */}
        <div className="flex-1 relative flex flex-col h-full z-10 w-full overflow-y-auto">
          <AnimatePresence mode="wait">

            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col pt-6 pb-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-4">
                  <button className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-neutral-700" />
                  </button>
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
                      <HelpCircle className="w-6 h-6 text-neutral-700" />
                    </button>
                    <button className="p-2 -mr-2 rounded-full hover:bg-neutral-100 transition-colors">
                      <MoreVertical className="w-6 h-6 text-neutral-700" />
                    </button>
                  </div>
                </div>

                <div className="px-6 flex-1 flex flex-col justify-start mt-4">
                  {/* Merchant Info */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(0,0,100,0.1)] mb-4">
                      <Building2 className="w-9 h-9 text-blue-600" strokeWidth={1.5} />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        <Check className="w-5 h-5 text-green-600 bg-green-50 rounded-full p-0.5" strokeWidth={2.5} />
                      </div>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-neutral-900 mb-1">
                      Balaji Distributors
                    </h1>
                    <p className="text-sm font-medium text-neutral-500">
                      balaji@upi
                    </p>
                  </div>

                  {/* Amount Section */}
                  <div className="bg-white rounded-3xl border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-8 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400 opacity-20"></div>
                    <p className="text-neutral-500 text-sm font-medium mb-2 uppercase tracking-wider">
                      Payment Request
                    </p>
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-semibold text-neutral-900 mr-1">₹</span>
                      <span className="text-[3.5rem] leading-none font-bold text-neutral-900 tracking-tight">
                        {PAYMENT_AMOUNT}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-center bg-green-50 text-green-700 py-1.5 px-3 rounded-full space-x-1.5 border border-green-100">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-semibold tracking-wide">
                        Verified Merchant
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="w-full bg-neutral-50 rounded-2xl p-4 mb-6">
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-neutral-500">Transaction ID</span>
                     <span className="text-neutral-800 font-medium font-mono">
                       {session?.transactionId || "Loading..."}
                     </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500">Request expires in</span>
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 text-center max-w-[280px] mx-auto mt-2">
                    Please verify the merchant details carefully before proceeding.
                  </p>
                </div>

                {/* Footer / Pay Button */}
                <div className="px-6 pt-4 pb-2 mt-auto">
                  <button
                    onClick={handlePay}
                    disabled={timeLeft <= 0}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-[17px] font-semibold py-[18px] rounded-full transition-all active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(26,115,232,0.4)]"
                  >
                    Pay Now
                  </button>
                  <div className="flex flex-col items-center mt-5">
                    <div className="flex items-center space-x-1 grayscale opacity-60 pointer-events-none mb-1">
                       <ShieldCheck className="w-4 h-4 text-neutral-500" />
                       <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">100% Secure</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center px-6"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  <div className="w-24 h-24 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-full flex items-center justify-center relative z-10">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">Processing Payment</h2>
                <p className="text-sm text-neutral-500 text-center max-w-[260px]">
                  Securely connecting to your bank... Please do not close this screen.
                </p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full relative"
              >
                {/* Background Confetti Pattern or subtle gradient */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#12B76A]/15 to-transparent -z-10" />

                <div className="flex-1 flex flex-col items-center pt-16 px-6 overflow-y-auto pb-4">
                  {/* Animated Success Icon */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1
                    }}
                    className="w-28 h-28 bg-[#12B76A] rounded-full flex items-center justify-center shadow-[0_12px_24px_-6px_rgba(18,183,106,0.3)] mb-6"
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Check className="w-14 h-14 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center w-full"
                  >
                    <p className="text-green-700 text-sm font-semibold mb-1 tracking-wide uppercase">
                      Payment Successful
                    </p>
                    <div className="text-[2.75rem] font-bold tracking-tight text-neutral-900 mb-6">
                      ₹{PAYMENT_AMOUNT}
                    </div>

                    {/* Receipt Card */}
                    <div className="w-full bg-white border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-3xl p-6 text-sm divide-y divide-neutral-100">
                      <div className="flex justify-between items-center pb-4">
                        <span className="text-neutral-500">Paid to</span>
                        <span className="font-semibold text-neutral-900 text-right">
                          Balaji Distributors
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-4">
                        <span className="text-neutral-500">Time</span>
                        <span className="font-medium text-neutral-900 text-right">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="text-neutral-500">Transaction ID</span>
                        <span className="font-medium text-neutral-900 font-mono text-xs break-all text-right max-w-[160px]">
                         {session?.transactionId || "N/A"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="px-6 pb-6 mt-auto bg-white"
                >
                  <div className="text-center mb-6">
                    <p className="text-xl font-semibold text-neutral-900 tracking-tight">Thank You!</p>
                    <p className="text-neutral-500 text-sm mt-1">Please shop with us again.</p>
                  </div>
                  <button
                    onClick={() => {

                      alert(
                        "Payment completed successfully. You may now return to the desktop application."
                      );

                    }}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[17px] font-semibold py-[16px] rounded-full transition-all shadow-[0_8px_20px_-6px_rgba(26,115,232,0.4)]"
                  >
                    Done
                  </button>
                </motion.div>
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full relative"
              >
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-red-500/10 to-transparent -z-10" />

                <div className="flex-1 flex flex-col items-center pt-20 px-6">
                  {/* Shaking Failed Icon */}
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{
                      x: [0, -10, 10, -10, 10, 0],
                    }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10 mb-8"
                  >
                    <XCircle className="w-14 h-14 text-red-500" strokeWidth={2.5} />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center w-full"
                  >
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
                      Payment Failed
                    </h2>
                    <p className="text-neutral-500 text-center mb-8 px-4">
                      Your transaction could not be completed at this time. No money has been deducted.
                    </p>

                    <div className="w-full bg-white border border-red-100 shadow-sm rounded-2xl p-4 flex gap-4 items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>



                        <h4 className="text-sm font-semibold text-neutral-900">
                          Payment Attempt Failed
                        </h4>
                        <p className="text-sm text-neutral-500 mt-1">
                          {errorMessage ||
                           "Payment could not be completed."}
                        </p>

                        <p className="text-sm text-neutral-500 mt-2">
                          Please generate a new QR code from the desktop application.
                        </p>


                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="px-6 pb-8 mt-auto"
                >

                  <button
                    onClick={() => {

                      alert(
                        "Please generate a new QR code from the desktop application."
                      );

                    }}
                    className="w-full mb-3 flex justify-center items-center gap-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[17px] font-semibold py-[16px] rounded-full transition-all shadow-lg shadow-blue-500/20"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    Generate New QR
                  </button>

                  <button
                    onClick={() => {

                      alert(
                        "This payment session has ended. Please generate a new QR code from the desktop application."
                      );

                    }}
                    className="w-full border border-neutral-300 text-neutral-700 text-[17px] font-medium py-[16px] rounded-full"
                  >
                    Close
                  </button>

                </motion.div>
                </motion.div>
            )}

            {status === 'expired' && (
              <motion.div
                key="expired"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center px-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-24 h-24 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(234,88,12,0.1)]"
                >
                  <Clock className="w-10 h-10 text-orange-500" strokeWidth={2.5} />
                </motion.div>

                <h2 className="text-2xl font-bold text-neutral-900 mb-3 text-center">Payment Request Expired</h2>

                <div className="bg-neutral-50 rounded-2xl p-5 mb-8 text-center border border-neutral-100">
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    The desktop checkout session has timed out due to inactivity. <strong className="text-neutral-900 font-medium">Any payment made now will not be registered.</strong>
                  </p>
                </div>

                <p className="text-sm text-neutral-500 text-center mb-8">
                  Please generate a new QR code from the desktop platform to continue.
                </p>

                <button
                  onClick={() => {

                     alert(
                        "Session expired. Please generate a new QR code from the desktop application."
                     );

                  }}
                  className="w-full bg-neutral-900 text-white font-medium py-4 rounded-full hover:bg-neutral-800 transition-colors shadow-lg"
                >
                  Go Back to Start
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>


      </div>

    </div>
  );
}


