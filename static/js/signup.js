// 🔹 Pastikan script berjalan setelah halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const signInLink = document.getElementById("signInLink"); // Link ke halaman signin
    const passwordInput = document.getElementById("password"); // Input password
    const showPasswordCheckbox = document.getElementById("showPassword"); // Checkbox Show Password

    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Mencegah form submit default

            // 🔹 Ambil nilai input dari form
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = passwordInput.value.trim();

            // 🔹 Validasi apakah semua kolom sudah diisi
            if (!username || !email || !password) {
                showError("Harap isi semua kolom!", "registerErrorContainer");
                return;
            }

            // 🔹 Kirim data ke server Flask
            fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            })
            .then(response => response.json()) // Parsing JSON response
            .then(data => {
                if (data.success) {
                    alert("Registrasi berhasil! Silakan login.");
                    clearInputs(); // 🔹 Kosongkan input setelah sukses
                    window.location.href = "/signin"; // 🔹 Redirect ke halaman signin
                } else {
                    showError(data.error, "registerErrorContainer");
                }
            })
            .catch(error => {
                console.error("❌ Error:", error);
                alert("Terjadi kesalahan saat registrasi. Silakan coba lagi!");
            });
        });
    }

    // 🔹 Fungsi menampilkan error ke UI
    function showError(message, containerId) {
        const errorContainer = document.getElementById(containerId);
        if (errorContainer) {
            errorContainer.innerHTML = `<p style="color:red;">${message}</p>`;
        } else {
            alert(message);
        }
    }

    // 🔹 Fungsi untuk mengosongkan input setelah registrasi sukses
    function clearInputs() {
        document.querySelectorAll('input').forEach(input => input.value = '');
    }

    // 🔹 HANDLE "SIGN IN" LINK - Navigasi ke halaman signin
    if (signInLink) {
        signInLink.addEventListener("click", function(event) {
            event.preventDefault();
            window.location.href = "/signin"; // 🔹 Redirect ke halaman signin yang benar
        });
    }

    // 🔹 Fungsi Show Password
    if (passwordInput && showPasswordCheckbox) {
        showPasswordCheckbox.addEventListener("change", function () {
            passwordInput.type = this.checked ? "text" : "password";
        });
    }

    // 🔹 Event listener ikon sosial media (jika ada)
    document.querySelectorAll('.social').forEach(icon => {
        icon.addEventListener('click', () => {
            window.location.href = '/under_construction';
        });
    });
});
