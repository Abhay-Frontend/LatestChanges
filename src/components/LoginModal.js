"use client";
import React, { useState } from "react";
import { X, Phone, Shield, Play } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { endPoints } from "@/utils/endpoints";
import axiosHttp from "@/utils/axioshttp";
import { Toaster, toast } from "react-hot-toast";
import GoogleLogin from "./GoogleLogin";

import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/redux/slices/userSlice";
import {
  closePhoneAuthModal,
  setPhoneAuthModalClosing,
} from "@/redux/slices/loginmodalSlice";
import useNewsletterSubscribe from "@/hooks/useNewsletterSubscribe";

const PhoneAuthModal = () => {
  const router = useRouter();
  const dispatch = useDispatch(); // ✅ Initialize dispatch
  const isOpen = useSelector((state) => state.modal.phoneAuthModal); // 🔥 use redux
  const { subscribeToNewsletter } = useNewsletterSubscribe();
  const [currentStep, setCurrentStep] = useState("phone");
  const [authType, setAuthType] = useState("login"); // "login" or "signup"
  const [phoneNumber, setPhoneNumber] = useState("");

  // const [currentStep, setCurrentStep] = useState("details"); // BYPASS: Changed from "phone" to "details" for testing
  // const [authType, setAuthType] = useState("signup"); // BYPASS: Changed from "login" to "signup" for testing
  // const [phoneNumber, setPhoneNumber] = useState("7903952488"); // BYPASS: Set default for testing

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  // Updated state for step 3 form data
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    gender: "",
  });
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  const signUpEndPoint = `${endPoints.auth}`; // For "I'm New Here" - signup
  const signInEndPoint = `${endPoints.signin}`; // For "Sign In" - login
  const verifyOtpendPoint = `${endPoints.verifyOtp}`;
  const resendOtpendPoint = `${endPoints.resendOtp}`;
  const updateUserEndPoint = `${endPoints.updateUser}`;
  const socialSignInEndPoint = `${endPoints.socialSignIn}`;

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // ✅ BYPASS FOR LOCALHOST
  if (process.env.NODE_ENV === "development") {
    const dummyUser = {
      id: 1,
      fullName: "Test User",
      phone: `+91${phoneNumber}`,
      email: "test@example.com",
      token: "dummy-token",
    };

    dispatch(setUser(dummyUser));
    setCurrentStep("welcome");
    return;
  }


    setLoading(true);
    try {
      // Use different endpoints based on auth type
      const endpoint = authType === "login" ? signInEndPoint : signUpEndPoint;

      const response = await axiosHttp.post(endpoint, {
        phone: `+91${phoneNumber}`,
      });

      if (response.status === 200) {
        setCurrentStep("otp");
        setOtpSuccess(true);
        setResendCountdown(60);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return; // ⬅️ Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 4) {
      toast.error("Please enter complete OTP");
      return;
    }

    setLoading(true);
    try {
      const requestData = { phone: `+91${phoneNumber}`, otp: otpString };

      if (authType === "login") requestData.type = "login";

      const response = await axiosHttp.post(verifyOtpendPoint, requestData);

      // Use response.data.status for OTP verification
      if (response.data?.status === 200) {
        toast.success(response.data.message || "OTP verified successfully!");

        localStorage.setItem("userPhone", `+91${phoneNumber}`);

        if (authType === "login") {
          dispatch(setUser(response.data.data));

          setCurrentStep("welcome");
        } else {
          setCurrentStep("details");
        }
      } else {
        // If backend returns 200 HTTP but status != 200 in body
        toast.error(response.data?.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Updated function to handle step 3 form submission with API call (only for signup)
  const handleDetailsSubmit = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.gender) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // Get phone number from localStorage
      const storedPhone = localStorage.getItem("userPhone");

      const formData = {
        fullName: userDetails.name,
        email: userDetails.email,
        gender: userDetails.gender,
        type: "signup",
        phone: storedPhone || `+91${phoneNumber}`, // fallback to current phoneNumber if not in localStorage
      };

      // Use signup endpoint for user details submission
      const res = await axiosHttp.put(updateUserEndPoint, formData);

      if (res.status === 200) {
        dispatch(setUser(res.data.data));

        // Subscribe to newsletter if checkbox is selected
        if (subscribeNewsletter) {
          await subscribeToNewsletter(userDetails.email);
        }

        setCurrentStep("welcome");
      } else {
        toast.error(
          `Signup failed: ${res.data?.message || "Please try again"}`,
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCountdown > 0) return;

    setLoading(true);
    setResendMessage("");
    setResendError("");
    try {
      const res = await axiosHttp.post(resendOtpendPoint, {
        phone: `+91${phoneNumber}`,
      });

      setOtpSuccess(true);
      setResendCountdown(60);
      setResendMessage(res?.data?.message || "OTP resent successfully");
    } catch (error) {
      setResendError(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect
  React.useEffect(() => {
    let interval;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const closeModal = () => {
    // Set closing flag to prevent re-opening during cleanup
    dispatch(setPhoneAuthModalClosing(true));

    // Dispatch close action
    dispatch(closePhoneAuthModal());

    // Reset form states
    setCurrentStep("phone");
    setAuthType("login");
    setPhoneNumber("");
    setOtp(["", "", "", ""]);
    setUserDetails({ name: "", email: "", gender: "" });
    setSubscribeNewsletter(false);
    setOtpSuccess(false);
    setResendCountdown(0);
    setResendMessage("");
    setResendError("");

    // Reset closing flag after modal animation completes
    setTimeout(() => {
      dispatch(setPhoneAuthModalClosing(false));
    }, 300);
  };

  const handleAuthTypeChange = (type) => {
    setAuthType(type);
    // Reset form when switching auth types
    setPhoneNumber("");
    setOtp(["", "", "", ""]);
    setUserDetails({ name: "", email: "", gender: "" });
  };

  const handleGoogleLoginSuccess = async ({ user, token }) => {
    setLoading(true);
    try {
      // Extract provider data
      const providerData = user.providerData[0];

      // Format data for API
      const socialSignInData = {
        email: providerData.email,
        name: providerData.displayName,
        provider: providerData.providerId,
        providerId: providerData.uid,
      };

      // Send to backend API
      const response = await axiosHttp.post(
        socialSignInEndPoint,
        socialSignInData,
      );

      if (response.data?.status === 200) {
        const userData = response.data.data;

        // Store the entire user data (including token) in Redux - same as phone login
        dispatch(setUser(userData));

        toast.success("Successfully signed in with Google!");
        setCurrentStep("welcome");
      } else {
        toast.error(response.data?.message || "Failed to sign in");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete Google sign-in",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = (error) => {
    // Handle specific error cases
    if (error.code === "auth/popup-closed-by-user") {
      toast.error("Sign-in popup was closed");
    } else if (error.code === "auth/popup-blocked") {
      toast.error("Please allow popups for this site");
    } else {
      toast.error("Failed to sign in with Google");
    }
  };

  return (
    <div className=" flex items-center justify-center">
      {/* Add Toaster component */}
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            iconTheme: {
              primary: "#9c90ff",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#9c90ff",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-80">
          <div
            className="bg-white shadow-xl w-full max-w-4xl 
                max-h-[80vh] md:h-auto md:max-h-[600px]
                flex flex-col md:flex-row overflow-hidden rounded-lg"
          >
            {/* Left Side - Image */}
            <div
              className="w-full md:w-1/2 bg-black flex items-center justify-center relative 
                h-48 md:h-auto"
            >
              {/* LaFetch Logo - Only show on steps 1-3 */}
              {currentStep !== "welcome" && (
                <div className="absolute -top-[15px] left-8 ">
                  <Image
                    src="/images/logo-white.png"
                    alt="LaFetch Logo"
                    width={120}
                    height={40}
                    className="object-contain"
                  />
                </div>
              )}

              {/* App Store Links - Top Right */}
              {currentStep !== "welcome" && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <a
                    href="https://apps.apple.com/in/app/lafetch-fetch-your-fashion/id6739497338"
                    //target="_blank"
                   // rel="noopener noreferrer"
                    className="bg-white hover:bg-gray-100 rounded-lg p-2 transition-all cursor-pointer shadow-md"
                    title="Download on App Store"
                  >
                    <Image
                      src="/images/Apple.png"
                      alt="Apple App Store"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </a>
                  <a
                    href="https://play.google.com/store/search?q=lafetch&c=apps&hl=en"
                   // target="_blank"
                   // rel="noopener noreferrer"
                    className="bg-white hover:bg-gray-100 rounded-lg p-2 transition-all cursor-pointer shadow-md"
                    title="Get it on Google Play"
                  >
                    <Play className="w-5 h-5 text-black fill-black" />
                  </a>
                </div>
              )}

              {/* Conditional content based on step */}
              {currentStep === "welcome" ? (
                // Step 4 - Welcome screen content
                <div className="flex flex-col items-center justify-center text-center text-white">
                  <Image
                    src="/images/iphone-login.png"
                    alt="Phone"
                    width={350}
                    height={0}
                    className="object-contain "
                  />
                </div>
              ) : (
                // Steps 1, 2, 3 - Mobile screenshots
                <div className="flex flex-col items-center justify-center mt-[50px]">
                  <Image
                    src="/images/iphone-login.png"
                    alt="App preview"
                    width={350}
                    height={0}
                    className="rounded-3xl shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Right Side - Form */}
            <div
              className={`w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center relative 
  overflow-y-auto ${currentStep === "welcome" ? "bg-black" : "bg-white"}`}
            >
              {/* Close Button inside right side */}
              <button
                onClick={closeModal}
                className={`absolute top-4 right-4 hover:opacity-60 cursor-pointer ${
                  currentStep === "welcome" ? "text-white" : "text-black"
                }`}
              >
                <X size={24} />
              </button>

              {currentStep === "phone" ? (
                // Phone Number Step with Auth Type Toggle
                <>
                  <div className="text-center mt-8">
                    <h2 className="text-2xl  text-black mb-2">
                      Continue with Mobile Number
                    </h2>
                    <p className="text-black">
                      Be part of the Exciting Discounts — Join us today!
                    </p>

                    {/* Auth Type Toggle */}
                    <div className="flex justify-center mb-6">
                      <div className="flex  rounded-lg p-1 ">
                        <button
                          onClick={() => handleAuthTypeChange("login")}
                          className={`px-6 py-2  font-medium transition-colors cursor-pointer ${
                            authType === "login"
                              ? "border-b-[2px] border-black text-black "
                              : "text-black hover:text-gray-700"
                          }`}
                        >
                          SIGN IN
                        </button>
                        <button
                          onClick={() => handleAuthTypeChange("signup")}
                          className={`px-6 py-2 font-medium transition-colors cursor-pointer ${
                            authType === "signup"
                              ? "border-b-[2px] border-black text-black"
                              : "text-black hover:text-gray-700"
                          }`}
                        >
                          I'M NEW HERE
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Phone Number
                      </label>
                      <div className="flex">
                        <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                          <span className="text-[#9c90ff] mr-2">🇮🇳</span>
                          <span className="text-black">+91</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="1234567890"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md 
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
             placeholder-gray-400 text-black"
                          maxLength="10"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePhoneSubmit}
                      disabled={loading}
                      className="w-full bg-black text-white py-3 rounded-md font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading
                        ? "Sending..."
                        : authType === "login"
                          ? "Sign In"
                          : "Sign Up"}
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">
                        or
                      </span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* Google Login */}
                    <div className="w-full">
                      <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                      />
                    </div>

                    <p className="text-sm text-black text-center">
                      By continuing, you agree to Lafetch's{" "}
                      <span className=" font-[400]">Terms & Conditions</span>{" "}
                      and <span className=" font-[400]">Privacy Policy</span>
                    </p>
                  </div>
                </>
              ) : currentStep === "otp" ? (
                // OTP Verification Step
                <>
                  <div className="text-center mb-8">
                    {/* Back button moved to step 2 */}
                    <button
                      onClick={() => setCurrentStep("phone")}
                      className="absolute top-4 left-4 text-black hover:text-gray-600"
                    >
                      ←
                    </button>
                    <h2 className="text-2xl  text-black mb-2">
                      Verify your Mobile Number
                    </h2>
                    <p className="text-black mb-4">
                      Be part of the Exciting Discounts — Join us today!
                    </p>
                    <p className="text-black">We sent a 4-digit code to</p>
                    <p className="font-medium text-black">+91 {phoneNumber}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-center space-x-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Backspace" &&
                              !otp[index] &&
                              index > 0
                            ) {
                              const prevInput = document.getElementById(
                                `otp-${index - 1}`,
                              );
                              if (prevInput) prevInput.focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          maxLength="1"
                        />
                      ))}
                    </div>

                    {otpSuccess && (
                      <div className="flex items-center justify-center text-[#9c90ff] text-sm font-medium">
                        <span className="text-lg mr-2">✓</span>
                        OTP has been sent successfully!
                      </div>
                    )}

                    {resendMessage && (
                      <div className="flex items-center justify-center text-[#9c90ff] text-sm font-medium">
                        <span className="text-lg mr-2">✓</span>
                        {resendMessage}
                      </div>
                    )}

                    {resendError && (
                      <div className="flex items-center justify-center text-[#9c90ff] text-sm font-medium">
                        <span className="text-lg mr-2">✕</span>
                        {resendError}
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-black">
                        Haven't received your code?{" "}
                        <button
                          onClick={resendOtp}
                          disabled={loading || resendCountdown > 0}
                          className={`font-medium ${
                            resendCountdown > 0
                              ? "text-gray-800 cursor-not-allowed"
                              : "text-black underline hover:text-black cursor-pointer"
                          } disabled:opacity-50`}
                        >
                          {resendCountdown > 0
                            ? `Resend in ${resendCountdown}s`
                            : "Resend Now"}
                        </button>
                      </p>
                    </div>

                    <button
                      onClick={handleOtpSubmit}
                      disabled={loading}
                      className="w-full bg-black text-white py-3 rounded-md font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "Verifying..." : "Continue"}
                    </button>
                  </div>
                </>
              ) : currentStep === "details" ? (
                // Step 3 - User Details Form (Only shown for signup)
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl  text-black mb-2">
                      ONE LAST STEP!
                    </h2>
                    <p className="text-black">
                      Let's get to know you a bit more.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={userDetails.name}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            name: e.target.value,
                          })
                        }
                        placeholder="Write your name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                 placeholder-gray-400 text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userDetails.email}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            email: e.target.value,
                          })
                        }
                        placeholder="Write your email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                 placeholder-gray-400 text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Gender
                      </label>
                      <select
                        value={userDetails.gender}
                        onChange={(e) =>
                          setUserDetails({
                            ...userDetails,
                            gender: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                                 text-black"
                      >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newsletter"
                        checked={subscribeNewsletter}
                        onChange={(e) =>
                          setSubscribeNewsletter(e.target.checked)
                        }
                        className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded cursor-pointer"
                      />
                      <label
                        htmlFor="newsletter"
                        className="ml-2 text-sm  text-black cursor-pointer"
                      >
                        Subscribe to our newsletter
                      </label>
                    </div>

                    <button
                      onClick={handleDetailsSubmit}
                      disabled={loading}
                      className="w-full bg-black text-white py-3 rounded-md font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "Creating Account..." : "Continue"}
                    </button>
                  </div>
                </>
              ) : (
                // Step 4 - Welcome Screen with Black Background
                <>
                  <div className="text-center text-white h-full flex flex-col justify-between">
                    <div className="flex-1 flex flex-col justify-center">
                      <h2 className="text-2xl  mb-4">
                        {authType === "login"
                          ? "Welcome Back!"
                          : "Welcome to LaFetch!"}
                      </h2>
                      <p className="mb-8">
                        {authType === "login"
                          ? "Great to see you again! Continue exploring amazing fashion deals."
                          : "You're all set! Start exploring amazing fashion deals."}
                      </p>
                      <button
                        onClick={() => {
                          router.push("/");
                          closeModal();
                        }}
                        className="w-full bg-white text-black py-3 rounded-md font-medium cursor-pointer transition-colors hover:bg-gray-100"
                      >
                        Get Started
                      </button>
                    </div>

                    {/* Logo at bottom for welcome screen */}
                    <div className="mt-8 flex justify-center">
                      <Image
                        src="/images/logo-purple.png"
                        alt="LaFetch Logo"
                        width={120}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneAuthModal;
