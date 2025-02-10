// 🔹 Ambil elemen-elemen form dan tombol
const container = document.getElementById('container');
const signInButton = document.getElementById('signIn');
const signInLink = document.getElementById('signInLink');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const loginForm = document.getElementById('loginForm');

// 🔹 Fungsi untuk mengosongkan inputan
function clearInputs() {
  document.querySelectorAll('input').forEach(input => input.value = '');
}

// 🔹 Event listener tombol "Masuk"
signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
  clearInputs();
});

// 🔹 Event listener link "Sudah punya akun? Masuk"
signInLink.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
  clearInputs();
});

// 🔹 Event listener link "Lupa password?"
forgotPasswordLink.addEventListener('click', () => {
  window.location.href = '/forgot-password';
});

// 🔹 Event listener ikon sosial media
document.querySelectorAll('.social').forEach(icon => {
  icon.addEventListener('click', () => {
    window.location.href = '/under_construction';
  });
});

// 🔹 Fungsi menampilkan error ke UI
function showError(message, containerId) {
  const errorContainer = document.getElementById(containerId);
  if (errorContainer) {
    errorContainer.innerHTML = `<p style="color:red;">${message}</p>`;
  } else {
    alert(message);
  }
}

// 🔹 Event Listener Saat Halaman Selesai Dimuat
document.addEventListener("DOMContentLoaded", function () {
  // 🔹 HANDLE LOGIN FORM
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "login",
        email: encodeURIComponent(email),
        password: encodeURIComponent(password),
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        showError(data.error, "loginErrorContainer");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Terjadi kesalahan. Silakan coba lagi!");
    });
  });
});
