document.addEventListener("DOMContentLoaded", function () {
    const resetPasswordForm = document.getElementById("resetPasswordForm");

    resetPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const email = document.getElementById("email").value; // Email diambil dari hidden input

        fetch(`/reset-password?email=${encodeURIComponent(email)}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ new_password: newPassword }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Password berhasil diperbarui! Silakan login.");
                window.location.href = "/";
            } else {
                document.getElementById("resetErrorContainer").innerHTML = `<p class="error">${data.error}</p>`;
            }
        })
        .catch(error => console.error("Error:", error));
    });
});

// Event listener untuk tombol kembali ke halaman login
document.getElementById('backToLogin').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = "/"; // Redirect ke halaman login
});
