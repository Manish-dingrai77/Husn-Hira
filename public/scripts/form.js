// Adjust form height on mobile
function adjustFormHeight() {
  const formContainer = document.querySelector('.form-container');
  if (window.innerWidth < 768) {
    formContainer.style.minHeight = 'calc(100vh - 120px)';
  } else {
    formContainer.style.minHeight = '';
  }
}
adjustFormHeight();
window.addEventListener('resize', adjustFormHeight);

// Razorpay Checkout Logic
document.getElementById("buy-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const address = document.getElementById("address").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const alternate = document.getElementById("alternate-mobile").value.trim();
  const coupon = document.getElementById("coupon").value.trim().toUpperCase();
  const termsAccepted = document.getElementById("terms").checked;

  // Validation
  if (!name || name.length < 3) {
    return Swal.fire('Invalid Name', 'Please enter a valid name.', 'warning');
  }
  if (!address || address.length < 10) {
    return Swal.fire('Invalid Address', 'Please enter a valid full address.', 'warning');
  }
  if (!/^\d{10}$/.test(mobile)) {
    return Swal.fire('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', 'warning');
  }
  if (alternate && !/^\d{10}$/.test(alternate)) {
    return Swal.fire('Invalid Alternate', 'Please enter a valid 10-digit alternate number.', 'warning');
  }
  if (!termsAccepted) {
    return Swal.fire('Terms Not Accepted', 'Please accept the Terms & Conditions to proceed.', 'warning');
  }

  // Create Razorpay Order via backend
  const response = await fetch("/api/createOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      address,
      mobile_number: mobile,
      alternate_number: alternate,
      coupon
    }),
  });

  const order = await response.json();

  if (!order || !order.id) {
    return Swal.fire('Order Failed', 'Failed to create order. Please try again.', 'error');
  }

  // Razorpay Checkout
  const options = {
    key: "rzp_test_ktweM0GM157h7A", // ✅ Replace with your live key in production
    amount: order.amount,
    currency: "INR",
    name: "Husn Hira",
    description: "Korean Glass Face Pack",
    image: "/Assets/logo.png",
    order_id: order.id,
    handler: async function (response) {
      // ✅ Send full details again for DB save
      const verify = await fetch("/api/verifyPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          mobile_number: mobile,
          alternate_number: alternate,
          coupon,
          order_id: order.id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      });

      const result = await verify.json();
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful!',
          text: 'Thank you for your order.',
          confirmButtonColor: '#ff6b8b',
        }).then(() => {
          window.location.href = "/";
        });
      } else {
        Swal.fire('Payment Verification Failed', 'Please contact support.', 'error');
      }
    },
    prefill: {
      name,
      contact: mobile,
    },
    theme: {
      color: "#ff6b8b",
    },
    method: {
      card: true,
      upi: true,
      netbanking: true,
      wallet: false,
      emi: false,
      paylater: false,
    },
    modal: {
      ondismiss: function () {
        Swal.fire('Payment Cancelled', 'You closed the payment popup. No transaction occurred.', 'info');
      },
    },
  };

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", function (response) {
    Swal.fire('Payment Failed', response.error.description || 'Something went wrong.', 'error');
  });

  rzp.open();
});
