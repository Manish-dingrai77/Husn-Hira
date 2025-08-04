// ✅ Adjust form height on mobile devices
function adjustFormHeight() {
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.style.minHeight = window.innerWidth < 768 ? 'calc(100vh - 120px)' : '';
  }
}
adjustFormHeight();
window.addEventListener('resize', adjustFormHeight);

// ✅ Handle Buy Now Button Click
document.getElementById("buyBtn")?.addEventListener("click", async function (e) {
  e.preventDefault();
  // ✅ Get form values
  const name = document.getElementById("name")?.value.trim();
  const address = document.getElementById("address")?.value.trim();
  const mobile = document.getElementById("mobile")?.value.trim();
  const alternate = document.getElementById("alternate-mobile")?.value.trim();
  const coupon = document.getElementById("coupon")?.value.trim().toUpperCase();
  const termsAccepted = document.getElementById("terms")?.checked;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

  // ✅ Validation
  if (!name || name.length < 3) {
    return Swal.fire('Invalid Name', 'Please enter a valid name.', 'warning');
  }
  if (!address || address.length < 10) {
    return Swal.fire('Invalid Address', 'Please enter your complete address.', 'warning');
  }
  if (!/^\d{10}$/.test(mobile)) {
    return Swal.fire('Invalid Mobile', 'Enter a valid 10-digit mobile number.', 'warning');
  }
  if (alternate && !/^\d{10}$/.test(alternate)) {
    return Swal.fire('Invalid Alternate Number', 'Enter a valid 10-digit alternate number.', 'warning');
  }
  if (!termsAccepted) {
    return Swal.fire('Terms Not Accepted', 'Please accept Terms & Conditions to continue.', 'warning');
  }

  // ✅ COD Flow
  if (paymentMethod === "COD") {
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
      Swal.fire('Error', 'Something went wrong while placing the order.', 'error');
    }
    return;
  }

  // ✅ Online Payment Flow
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

    if (!order?.id) {
      return Swal.fire('Order Failed', 'Could not initiate Razorpay order.', 'error');
    }

    const options = {
      key: "rzp_test_ktweM0GM157h7A", // 🔁 Replace with production key
      amount: order.amount,
      currency: "INR",
      name: "Husn Hira",
      description: "Korean Glass Face Pack",
      image: "/Assets/logo.png",
      order_id: order.id,
      handler: async function (response) {
        console.log("🧾 Razorpay Payment Response:", response);

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
          Swal.fire('Payment Cancelled', 'You closed the payment popup.', 'info');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("❌ Payment Failed:", response);
      Swal.fire('Payment Failed', response.error.description || 'Try again.', 'error');
    });

    rzp.open();
  } catch (err) {
    console.error("❌ Razorpay Init Error:", err);
    Swal.fire('Error', 'Could not start Razorpay payment.', 'error');
  }
});

const navEntries = performance.getEntriesByType("navigation");
if (navEntries.length > 0 && navEntries[0].type === "reload") {
  // If this is a page reload
  const cleanUrl = window.location.pathname;
  window.location.replace(cleanUrl); // removes query params like ?search=...
}

document.getElementById("refresh-btn")?.addEventListener("click", () => {
  // Clear input values
  document.getElementById("search").value = "";
  document.getElementById("date").value = "";

  // Reload page without filters
  window.location.href = window.location.pathname;
});

