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

// 🔹 Fungsi Menampilkan Loading State
function setLoading(isLoading) {
  const loginButton = document.getElementById("loginButton");
  if (isLoading) {
    loginButton.disabled = true;
    loginButton.innerHTML = "Loading...";
  } else {
    loginButton.disabled = false;
    loginButton.innerHTML = "Sign In";
  }
}

// 🔹 Event Listener Saat Halaman Selesai Dimuat
document.addEventListener("DOMContentLoaded", function () {
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      // 🔹 Tampilkan loading state
      setLoading(true);

      fetch("/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })
        .then((response) => {
          setLoading(false);
          if (!response.ok) {
            throw new Error("Terjadi kesalahan pada server.");
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            window.location.href = "/dashboard"; // 🔹 Berhasil login
          } else {
            showError(data.error, "loginErrorContainer");
          }
        })
        .catch((error) => {
          setLoading(false);
          console.error("Error:", error);
          alert("Terjadi kesalahan. Silakan coba lagi!");
        });
    });
  }
});
