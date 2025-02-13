// 🔹 Ambil elemen-elemen form dan tombol
const loginForm = document.getElementById("loginForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const signUpLink = document.getElementById("signUpLink");

// 🔹 Fungsi untuk mengosongkan inputan
function clearInputs() {
  document.querySelectorAll("input").forEach((input) => (input.value = ""));
}

// 🔹 Event listener link "Forgot Password?"
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "/forgot-password"; // 🔹 Pindah ke halaman Forgot Password
  });
}

// 🔹 Event listener link "Belum punya akun? Sign Up"
if (signUpLink) {
  signUpLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "/signup"; // 🔹 Pindah ke halaman Sign Up
  });
}

// 🔹 Funngsi Show Password
document.addEventListener("DOMContentLoaded", function () {
    const showPasswordCheckbox = document.getElementById("showPassword");
    const passwordInput = document.getElementById("loginPassword"); // Sesuaikan dengan ID input password

    if (showPasswordCheckbox && passwordInput) {
        showPasswordCheckbox.addEventListener("change", function () {
            if (this.checked) {
                passwordInput.type = "text"; // Tampilkan password
            } else {
                passwordInput.type = "password"; // Sembunyikan password
            }
        });
    }
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

// 🔹 Fungsi Menampilkan Loading State
function setLoading(isLoading) {
  const loginButton = document.getElementById("loginButton");
  if (loginButton) {
    loginButton.disabled = isLoading;
    loginButton.innerHTML = isLoading ? "Loading..." : "Sign In";
  }
}

// 🔹 Event Listener Saat Halaman Selesai Dimuat
document.addEventListener("DOMContentLoaded", function () {
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const errorContainer = "loginErrorContainer"; // ID container untuk error

      // 🔹 Validasi input kosong
      if (!email || !password) {
        showError("Email dan password harus diisi!", errorContainer);
        return;
      }

      // 🔹 Tampilkan loading state
      setLoading(true);

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          setLoading(false);
          if (data.success) {
            window.location.href = "/dashboard"; // 🔹 Redirect ke dashboard jika login sukses
          } else {
            showError(data.error, errorContainer);
          }
        })
        .catch((error) => {
          setLoading(false);
          console.error("Error:", error);
          showError("Terjadi kesalahan. Silakan coba lagi!", errorContainer);
        });
    });
  }
});
