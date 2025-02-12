document.addEventListener("DOMContentLoaded", function () {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const errorContainer = document.getElementById("forgotErrorContainer");
    const submitButton = document.getElementById("forgotSubmit");

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = document.getElementById("forgotEmail").value.trim();

            // 🔹 Validasi input
            if (!email) {
                errorContainer.innerHTML = `<p class="error">Email harus diisi!</p>`;
                return;
            }

            // 🔹 Tampilkan loading state
            submitButton.disabled = true;
            submitButton.innerText = "Memproses...";

            fetch("/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email }),
            })
            .then(response => response.json())
            .then(data => {
                // 🔹 Reset loading state
                submitButton.disabled = false;
                submitButton.innerText = "Kirim";

                if (data.success) {
                    // 🔹 Berhasil: Redirect ke halaman reset password
                    window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
                } else {
                    // 🔹 Tampilkan error dari server
                    errorContainer.innerHTML = `<p class="error">${data.error}</p>`;
                }
            })
            .catch(error => {
                console.error("Error:", error);
                errorContainer.innerHTML = `<p class="error">Terjadi kesalahan. Coba lagi nanti.</p>`;
                submitButton.disabled = false;
                submitButton.innerText = "Kirim";
            });
        });
    }

    // 🔹 Event listener untuk tombol kembali ke halaman login
    const backToLoginButton = document.getElementById("backToLogin");
    if (backToLoginButton) {
        backToLoginButton.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.href = "/"; // Redirect ke halaman login
        });
    }
});
