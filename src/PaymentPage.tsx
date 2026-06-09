import {motion } from 'framer-motion';
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from 'react';


import {
  ArrowLeft,
  Building2,
  Check,
  HelpCircle,
  Loader2,
  MoreVertical,
  ShieldCheck,
} from 'lucide-react';

type PaymentState =
  | 'idle'
  | 'processing'
  | 'success'
  | 'expired'
  | 'failed';

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

export default function PaymentPage() {

  const { id } = useParams();
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<PaymentState>('idle');
  const [timeLeft, setTimeLeft] = useState(298); // 04:58


 const PAYMENT_AMOUNT =
  session?.totalAmount ? Number(session.totalAmount)  .toLocaleString() : "0";

  // Generate a realistic looking transaction ID on mount

  useEffect(() => {

    fetch(

      `http://10.195.79.227:8080/checkout-session/${id}`
    )

      .then(res => res.json())

      .then(data => {

        console.log(
          "SESSION:",
          data
        );

        setSession(data);
      })

      .catch(error => {

        console.error(
          "Session fetch error:",
          error
        );
      });

  }, [id]);







  // Timer logic
  useEffect(() => {
    if (status !== 'idle' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handlePay = async () => {
    if (status !== 'idle') return;
    setStatus('processing');

    // Simulate network delay and payment processing
    try {

      const response =
        await fetch(

          `http://10.195.79.227:8080/checkout-session/${id}/pay`,

          {
            method: "POST"
          }
        );

      if (!response.ok) {

        const errorData =
          await response.json();

        console.error(
          "PAYMENT FAILED:",
          errorData
        );

        setStatus("failed");

        return;
      }

      const data =
        await response.json();

      console.log(
        "PAYMENT SUCCESS:",
        data
      );

      setSession(data);

      playSuccessSound();

      setStatus("success");


    } catch (error) {

      console.error(
        "Payment error:",
        error
      );

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

        {/* Dynamic Status Bar Area (Visual only) */}
        <div className="h-12 w-full flex items-center justify-between px-6 pt-2 shrink-0">
          <div className="text-[14px] font-medium tracking-tight">9:41</div>
          <div className="flex items-center space-x-2">
            {/* Fake Signal/Battery Icons using basic CSS shapes for simplicity */}
            <div className="flex items-end space-x-[2px] h-3 mb-0.5">
              <div className="w-[3px] h-1.5 bg-neutral-800 rounded-sm"></div>
              <div className="w-[3px] h-2 bg-neutral-800 rounded-sm"></div>
              <div className="w-[3px] h-2.5 bg-neutral-800 rounded-sm"></div>
              <div className="w-[3px] h-3 bg-neutral-800 rounded-sm"></div>
            </div>
            <div className="w-4 h-3 border border-neutral-800 rounded-[3px] p-[1px] relative">
              <div className="bg-neutral-800 w-full h-full rounded-[1px]"></div>
              <div className="absolute right-[-3px] top-1 w-0.5 h-1 bg-neutral-800 rounded-r-sm"></div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex flex-col h-full z-10 w-full overflow-y-auto">




            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col pt-2 pb-6"
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
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-[0_4px_20px_-4px_rgba(0,0,100,0.1)] mb-4">
                      <Building2 className="w-10 h-10 text-blue-600" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-neutral-900 mb-1">
                      Balaji Distributors
                    </h1>
                    <p className="text-sm font-medium text-neutral-500">
                      balaji@upi
                    </p>
                  </div>

                  {/* Amount Section */}
                  <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 mb-8 flex flex-col items-center">
                    <p className="text-neutral-500 text-sm font-medium mb-2 uppercase tracking-wider">
                      Paying
                    </p>
                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-semibold text-neutral-900 mr-1">₹</span>
                      <span className="text-[3.5rem] leading-none font-bold text-neutral-900 tracking-tight">
                        {PAYMENT_AMOUNT}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-center bg-green-50 text-green-700 py-1.5 px-3 rounded-full space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-semibold tracking-wide">
                        Verified Merchant
                      </span>
                    </div>
                  </div>

                  {/* Timer & Info */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full flex items-center text-sm font-medium">
                      Payment request expires in {formatTime(timeLeft)}
                    </div>

                    <p className="text-xs text-neutral-400 text-center max-w-[280px]">
                      Please verify the merchant details before proceeding with the payment.
                    </p>
                  </div>
                </div>

                {/* Footer / Pay Button */}
                <div className="px-6 pt-6 pb-2 mt-auto">
                  <button
                    onClick={handlePay}
                    disabled={timeLeft <= 0}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-[17px] font-semibold py-[18px] rounded-full transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
                  >
                    Pay Now
                  </button>
                  <p className="text-center mt-5 text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center justify-center space-x-1">
                    <span>Powered by</span>
                    <span className="text-neutral-600">UPI</span>
                  </p>
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
                  <div className="w-24 h-24 bg-white shadow-xl shadow-blue-900/5 rounded-full flex items-center justify-center relative z-10">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">Processing Payment</h2>
                <p className="text-sm text-neutral-500 text-center max-w-[260px]">
                  Please wait while we connect securely to your bank. Do not close this screen.
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
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#12B76A]/10 to-transparent -z-10" />

                <div className="flex-1 flex flex-col items-center pt-20 px-6">
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
                    className="w-28 h-28 bg-[#12B76A] rounded-full flex items-center justify-center shadow-xl shadow-green-500/20 mb-8"
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
                    <p className="text-neutral-500 text-sm font-medium mb-1 tracking-wide uppercase">
                      Payment Successful
                    </p>
                    <div className="text-4xl font-bold tracking-tight text-neutral-900 mb-8">
                      ₹{PAYMENT_AMOUNT}
                    </div>

                    {/* Receipt Card */}
                    <div className="w-full bg-white border border-neutral-100 shadow-sm rounded-3xl p-6 text-sm divide-y divide-neutral-100">
                      <div className="flex justify-between items-center pb-4">
                        <span className="text-neutral-500">Paid to</span>
                        <span className="font-semibold text-neutral-900 text-right">
                          Balaji Distributors
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-4">
                        <span className="text-neutral-500">UPI ID</span>
                        <span className="font-medium text-neutral-900">
                          balaji@upi
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="text-neutral-500">Transaction ID</span>
                        <span className="font-medium text-neutral-900 font-mono text-xs break-all text-right max-w-[160px]">
                          {session?.transactionId}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="px-6 pb-8 mt-auto"
                >
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setTimeLeft(298);
                    }}
                    className="w-full bg-transparent border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[17px] font-semibold py-[16px] rounded-full transition-all"
                  >
                    Done
                  </button>
                  <p className="text-center mt-5 text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center justify-center space-x-1">
                    <span>Powered by</span>
                    <span className="text-neutral-600">UPI</span>
                  </p>
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
                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-neutral-400" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">Request Expired</h2>
                <p className="text-sm text-neutral-500 text-center mb-8 max-w-[260px]">
                  The payment request has expired. Please ask the merchant to send a new request.
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setTimeLeft(298);
                  }}
                  className="w-full max-w-[200px] border border-neutral-300 text-neutral-700 font-medium py-3 rounded-full hover:bg-neutral-50 transition-colors"
                >
                  Go Back
                </button>
              </motion.div>
            )}


        </div>

        {/* Virtual Home Indicator */}
        <div className="h-6 w-full flex items-center justify-center pb-2 shrink-0 bg-transparent absolute bottom-0 z-20">
          <div className="w-32 h-1 bg-neutral-300/80 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}


