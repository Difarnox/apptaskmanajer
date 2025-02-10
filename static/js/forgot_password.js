document.addEventListener("DOMContentLoaded", function () {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    forgotPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("forgotEmail").value;

        fetch("/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ email: email }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = `/reset-password?email=${email}`;
            } else {
                document.getElementById("forgotErrorContainer").innerHTML = `<p class="error">${data.error}</p>`;
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
