// 🔹 Ambil elemen-elemen form dan tombol
const loginForm = document.getElementById("loginForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const signUpLink = document.getElementById("signUpLink");

// 🔹 Fungsi untuk mengosongkan inputan
function clearInputs() {
  document.querySelectorAll("input").forEach((input) => (input.value = ""));
}

// 🔹 Event listener link "Lupa password?"
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", () => {
    window.location.href = "/forgot-password";
  });
}

// 🔹 Event listener link "Belum punya akun? Sign Up"
if (signUpLink) {
  signUpLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "/signup"; // 🔹 Pindah ke halaman Sign Up
  });
}

// 🔹 Event listener ikon sosial media
document.querySelectorAll(".social").forEach((icon) => {
  icon.addEventListener("click", () => {
    window.location.href = "/under_construction";
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
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      fetch("/signin", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: encodeURIComponent(email),
          password: encodeURIComponent(password),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            window.location.href = "/dashboard"; // 🔹 Berhasil login
          } else {
            showError(data.error, "loginErrorContainer");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Terjadi kesalahan. Silakan coba lagi!");
        });
    });
  }
});
