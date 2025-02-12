document.addEventListener("DOMContentLoaded", function () {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const errorContainer = document.getElementById("resetErrorContainer");
    const submitButton = document.getElementById("resetSubmit");

    resetPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("newPassword").value.trim();
        const email = document.getElementById("email").value; // Email diambil dari hidden input

        // 🔹 Validasi input
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

        fetch(`/reset-password?email=${encodeURIComponent(email)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ new_password: newPassword }),
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
});

// 🔹 Event listener untuk tombol kembali ke halaman login
document.getElementById("backToLogin").addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "/"; // Redirect ke halaman login
});
