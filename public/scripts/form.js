// ✅ Adjust form height on mobile devices
function adjustFormHeight() {
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.style.minHeight = window.innerWidth < 768 ? 'calc(100vh - 120px)' : '';
  }
}
adjustFormHeight();
window.addEventListener('resize', adjustFormHeight);

// ✅ Show/hide COD delivery charge note
document.addEventListener("DOMContentLoaded", () => {
  const codNote = document.getElementById("cod-note");
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');

  paymentRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "COD" && radio.checked) {
        codNote.classList.remove("hidden");
      } else {
        codNote.classList.add("hidden");
      }
    });
  });
});

// ✅ Handle Buy Now Button Click
document.getElementById("buyBtn")?.addEventListener("click", async function (e) {
  e.preventDefault();
  const buyBtn = document.getElementById("buyBtn");

  const name = document.getElementById("name")?.value.trim();
  const address = document.getElementById("address")?.value.trim();
  const mobile = document.getElementById("mobile")?.value.trim();
  const alternate = document.getElementById("alternate-mobile")?.value.trim();
  const coupon = document.getElementById("coupon")?.value.trim().toUpperCase();
  const termsAccepted = document.getElementById("terms")?.checked;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

  if (!name || name.length < 3) {
    return Swal.fire('Invalid Name', 'Please enter a valid name.', 'warning');
  }
  if (!address || address.length < 10) {
    return Swal.fire('Invalid Address', 'Please enter your complete address.', 'warning');
  }
  if (!/^\d{10}$/.test(mobile)) {
    return Swal.fire('Invalid Mobile', 'Enter a valid 10-digit mobile number.', 'warning');
  }
  // if (!isMobileVerified) {
  //   return Swal.fire('Mobile Not Verified', 'Please verify your mobile number before placing the order.', 'warning');
  // }
  if (alternate && !/^\d{10}$/.test(alternate)) {
    return Swal.fire('Invalid Alternate Number', 'Enter a valid 10-digit alternate number.', 'warning');
  }
  if (!termsAccepted) {
    return Swal.fire('Terms Not Accepted', 'Please accept Terms & Conditions to continue.', 'warning');
  }

  if (paymentMethod === "COD") {
    const confirmed = await Swal.fire({
      title: "Confirm Your COD Order",
      text: "Cash on Delivery orders include ₹40 delivery charge. Do you want to continue?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Place Order",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2e7d32",
      cancelButtonColor: "#d33"
    });

    if (!confirmed.isConfirmed) return;

    buyBtn.disabled = true;

    Swal.fire({
      title: 'Placing Order...',
      text: 'Please wait',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch("/api/cod-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          mobile,
          altNumber: alternate,
          coupon,
        }),
      });

      const data = await res.json();
      Swal.close();
      buyBtn.disabled = false;

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Order Placed!',
          text: 'Your order has been successfully placed.',
          confirmButtonColor: '#ff6b8b',
        }).then(() => window.location.href = "/");
      } else {
        Swal.fire('Failed', data.message || 'Failed to place COD order.', 'error');
      }
    } catch (err) {
      Swal.close();
      buyBtn.disabled = false;
      Swal.fire('Error', 'Something went wrong while placing the order.', 'error');
    }

    return;
  }

  // ✅ Online Payment Flow
  buyBtn.disabled = true;

  try {
    const res = await fetch("/api/createOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        mobile_number: mobile,
        alternate_number: alternate,
        coupon,
      }),
    });

    const order = await res.json();
    buyBtn.disabled = false;

    if (!order?.id) {
      return Swal.fire('Order Failed', 'Could not initiate Razorpay order.', 'error');
    }

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: "INR",
      name: "Husn Hira",
      description: "Korean Glass Face Pack",
      image: "/Assets/logo.png",
      order_id: order.id,
      handler: async function (response) {
        try {
          const verifyRes = await fetch("/api/verifyPayment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              address,
              mobile_number: mobile,
              alternate_number: alternate,
              coupon,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            Swal.fire({
              icon: 'success',
              title: 'Payment Successful!',
              text: 'Thank you for your order.',
              confirmButtonColor: '#ff6b8b',
            }).then(() => window.location.href = "/");
          } else {
            Swal.fire('Verification Failed', verifyData.msg || 'Please contact support.', 'error');
          }
        } catch (err) {
          Swal.fire('Verification Error', 'Could not verify payment.', 'error');
        }
      },
      method: {
        card: true,
        upi: true,
        netbanking: true,
        wallet: false,
        emi: false,
        paylater: false,
      },
      prefill: {
        name: name,
        contact: mobile,
      },
      theme: {
        color: "#4361ee"
      },
      modal: {
        ondismiss: function () {
          buyBtn.disabled = false;
          Swal.fire('Payment Cancelled', 'You closed the payment popup.', 'info');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function (response) {
      buyBtn.disabled = false;
      console.error("❌ Payment Failed:", response);
      Swal.fire('Payment Failed', response.error.description || 'Try again.', 'error');
    });

    rzp.open();
  } catch (err) {
    buyBtn.disabled = false;
    console.error("❌ Razorpay Init Error:", err);
    Swal.fire('Error', 'Could not start Razorpay payment.', 'error');
  }
});

// ✅ Clean URL on reload
const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0 && navEntries[0].type === "reload") {
  const cleanUrl = window.location.pathname;
  window.location.replace(cleanUrl);
}

// ✅ Admin panel refresh button (if any)
document.getElementById("refresh-btn")?.addEventListener("click", () => {
  document.getElementById("search").value = "";
  document.getElementById("date").value = "";
  window.location.href = window.location.pathname;
});

// ✅ OTP Verification Logic
// let isMobileVerified = false;

// const sendOtpBtn = document.getElementById("sendOtpBtn");
// const verifyOtpBtn = document.getElementById("verifyOtpBtn");
// const otpSection = document.getElementById("otp-section");
// const otpInput = document.getElementById("otp-input");
// const otpStatus = document.getElementById("otp-status");
// const mobileInput = document.getElementById("mobile");

// sendOtpBtn?.addEventListener("click", async () => {
//   const mobile = mobileInput.value.trim();
//   if (!/^\d{10}$/.test(mobile)) {
//     return Swal.fire("Invalid Mobile", "Enter a valid 10-digit mobile number.", "warning");
//   }

//   sendOtpBtn.disabled = true;
//   sendOtpBtn.innerText = "Sending...";

//   try {
//     const res = await fetch("/api/send-otp", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ mobile }),
//     });

//     const data = await res.json();
//     sendOtpBtn.disabled = false;
//     sendOtpBtn.innerText = "Resend OTP";

//     if (data.success) {
//       otpSection.classList.remove("hidden");
//       otpSection.classList.add("active");
//       Swal.fire("OTP Sent", "Check your mobile for the OTP.", "success");
//     } else {
//       Swal.fire("Failed", data.message || "Could not send OTP.", "error");
//     }
//   } catch (err) {
//     sendOtpBtn.disabled = false;
//     sendOtpBtn.innerText = "Verify";
//     Swal.fire("Error", "Could not send OTP. Try again later.", "error");
//   }
// });

// verifyOtpBtn?.addEventListener("click", async () => {
//   const otp = otpInput.value.trim();
//   const mobile = mobileInput.value.trim();

//   if (!otp || otp.length !== 6) {
//     return Swal.fire("Invalid OTP", "Enter the 6-digit OTP you received.", "warning");
//   }

//   verifyOtpBtn.disabled = true;
//   verifyOtpBtn.innerText = "Verifying...";

//   try {
//     const res = await fetch("/api/verify-otp", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ mobile, otp }),
//     });

//     const data = await res.json();
//     verifyOtpBtn.disabled = false;
//     verifyOtpBtn.innerText = "Verified";

//     if (data.success) {
//       isMobileVerified = true;
//       otpStatus.innerText = "✔ Mobile Verified";
//       otpStatus.classList.add("success");
//       otpStatus.classList.remove("error");
//       otpInput.disabled = true;
//       verifyOtpBtn.disabled = true;
//       sendOtpBtn.disabled = true;
//       mobileInput.disabled = true;

//       // Optional auto-hide
//       setTimeout(() => {
//         otpSection.classList.remove("active");
//         otpSection.classList.add("hidden");
//       }, 1500);
//     } else {
//       isMobileVerified = false;
//       otpStatus.innerText = "❌ Incorrect OTP";
//       otpStatus.classList.add("error");
//       otpStatus.classList.remove("success");
//     }
//   } catch (err) {
//     verifyOtpBtn.disabled = false;
//     verifyOtpBtn.innerText = "Confirm OTP";
//     Swal.fire("Error", "Could not verify OTP. Try again.", "error");
//   }
// });
