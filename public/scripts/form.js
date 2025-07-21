// Form submission handling
const buyForm = document.getElementById('buy-form');

buyForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const address = document.getElementById('address').value;
  const mobile = document.getElementById('mobile').value;
  const terms = document.getElementById('terms').checked;

  if (!name || !address || !mobile || !terms) {
    alert('Please fill all required fields and accept the terms & conditions');
    return;
  }

  if (!/^\d{10}$/.test(mobile)) {
    alert('Please enter a valid 10-digit mobile number');
    return;
  }

  alert('Order placed successfully! You will be redirected to payment gateway.');
  buyForm.reset();
});

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
