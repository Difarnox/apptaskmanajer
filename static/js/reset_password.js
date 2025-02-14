document.addEventListener("DOMContentLoaded", function () {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const errorContainer = document.getElementById("resetErrorContainer");
    const submitButton = document.getElementById("resetSubmit");
    const backToLoginButton = document.getElementById("backToLogin");
    const emailField = document.getElementById("email"); // Hidden input email

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const newPassword = document.getElementById("newPassword").value.trim();
            const email = emailField.value.trim();

            // 🔹 Validasi input
            if (!email) {
                showError("Email tidak valid!");
                return;
            }

            if (!newPassword) {
                showError("Password tidak boleh kosong!");
                return;
            }

            if (newPassword.length < 6) {
                showError("Password harus minimal 6 karakter!");
                return;
            }

            // 🔹 Tampilkan loading state
            setLoading(true);

            fetch("/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, new_password: newPassword }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    submitButton.innerText = "Berhasil! Mengalihkan...";
                    setTimeout(() => {
                        window.location.href = "/signin"; // 🔹 Redirect ke halaman signin setelah sukses
                    }, 1500);
                } else {
                    showError(data.error);
                    setLoading(false);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showError("Terjadi kesalahan. Coba lagi nanti.");
                setLoading(false);
            });
        });
    }

    // 🔹 Fungsi Toggle Show Password
    const showPasswordCheckbox = document.getElementById("showNewPassword");
    const passwordField = document.getElementById("newPassword");

    if (showPasswordCheckbox && passwordField) {
        showPasswordCheckbox.addEventListener("change", function () {
            passwordField.type = this.checked ? "text" : "password";
        });
    }

    // 🔹 Event listener untuk tombol "Back to Login" dengan loading
    if (backToLoginButton) {
        backToLoginButton.addEventListener("click", function () {
            backToLoginButton.innerText = "Mengalihkan...";
            backToLoginButton.disabled = true;
            setTimeout(() => {
                window.location.href = "/signin"; // 🔹 Redirect ke halaman signin
            }, 1000);
        });
    }

    // 🔹 Fungsi Menampilkan Error ke UI
    function showError(message) {
        errorContainer.innerHTML = `<p class="error">${message}</p>`;
    }

    // 🔹 Fungsi Loading untuk Submit Button
    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.innerText = isLoading ? "Memproses..." : "Perbarui Password";
    }
});
