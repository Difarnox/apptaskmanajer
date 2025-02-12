document.addEventListener("DOMContentLoaded", function () {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const errorContainer = document.getElementById("resetErrorContainer");
    const submitButton = document.getElementById("resetSubmit");
    const emailField = document.getElementById("email"); // Hidden input email

    resetPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("newPassword").value.trim();
        const email = emailField.value.trim();

        // 🔹 Validasi input
        if (!email) {
            errorContainer.innerHTML = `<p class="error">Email tidak valid!</p>`;
            return;
        }

        if (!newPassword) {
            errorContainer.innerHTML = `<p class="error">Password tidak boleh kosong!</p>`;
            return;
        }

        if (newPassword.length < 6) {
            errorContainer.innerHTML = `<p class="error">Password harus minimal 6 karakter!</p>`;
            return;
        }

        // 🔹 Tampilkan loading state
        submitButton.disabled = true;
        submitButton.innerText = "Memproses...";

        fetch("/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, new_password: newPassword }),
        })
        .then(response => response.json())
        .then(data => {
            // 🔹 Reset loading state
            submitButton.disabled = false;
            submitButton.innerText = "Reset Password";

            if (data.success) {
                alert("Password berhasil diperbarui! Silakan login.");
                window.location.href = "/";
            } else {
                errorContainer.innerHTML = `<p class="error">${data.error}</p>`;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            errorContainer.innerHTML = `<p class="error">Terjadi kesalahan. Coba lagi nanti.</p>`;
            submitButton.disabled = false;
            submitButton.innerText = "Reset Password";
        });
    });

    // 🔹 Toggle visibility password
        document.getElementById("togglePassword").addEventListener("click", function () {
            const passwordField = document.getElementById("newPassword");
            if (passwordField.type === "password") {
                passwordField.type = "text";
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordField.type = "password";
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });

    // 🔹 Event listener untuk tombol kembali ke halaman login
    document.getElementById("backToLogin").addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "/"; // Redirect ke halaman login
    });
});
