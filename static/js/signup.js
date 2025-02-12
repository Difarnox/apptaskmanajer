// 🔹 Ambil elemen-elemen form dan tombol
const registerForm = document.getElementById('registerForm');
const signInLink = document.getElementById('signInLink'); // Link ke signin

// 🔹 Fungsi untuk mengosongkan inputan
function clearInputs() {
  document.querySelectorAll('input').forEach(input => input.value = '');
}

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
  // 🔹 HANDLE REGISTER FORM
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !email || !password) {
      showError("Harap isi semua kolom!", "registerErrorContainer");
      return;
    }

    fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: username,
        email: email,
        password: password,
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Registrasi berhasil! Silakan login.");
        window.location.href = "/signin"; // 🔹 Arahkan ke signin
      } else {
        showError(data.error, "registerErrorContainer");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat registrasi. Silakan coba lagi!");
    });
  });

  // 🔹 HANDLE "SIGN IN" LINK
  document.getElementById("signInLink").addEventListener("click", function(event) {
    event.preventDefault();
    window.location.href = "/signin"; // 🔹 Arahkan ke signin
  });
});
