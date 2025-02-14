document.addEventListener("DOMContentLoaded", function () {
    // Sidebar navigation
    const tabs = document.querySelectorAll(".nav-list li");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove("active"));

            // Show the selected tab content
            const tabName = this.getAttribute("data-tab");
            document.getElementById(`${tabName}-content`).classList.add("active");
        });
    });

    // Log out functionality
    const logoutTab = document.querySelector("[data-tab='logout']");
    logoutTab.addEventListener("click", function () {
        window.location.href = "/logout"; // Redirect to logout route
    });

    // Task Modal
    const taskModal = document.getElementById("task-modal");
    const addTaskBtn = document.getElementById("add-task-btn");
    const closeModalBtn = document.getElementById("close-modal");

    addTaskBtn.addEventListener("click", function () {
        taskModal.style.display = "block";
    });

    closeModalBtn.addEventListener("click", function (event) {
        event.preventDefault();
        taskModal.style.display = "none";
    });

    // Handle task form submission
    document.getElementById("task-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("task-title").value;
        const category = document.getElementById("task-category").value;
        const priority = document.getElementById("task-priority").value;
        const deadline = document.getElementById("task-deadline").value;
        const description = document.getElementById("task-desc").value;

        fetch("/add_task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, category, priority, deadline, description }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.reload(); // Reload dashboard to show new task
            } else {
                alert("Failed to add task");
            }
        })
        .catch(error => console.error("Error:", error));
    });

    // Mark task as done
    document.querySelectorAll(".complete-btn").forEach(button => {
        button.addEventListener("click", function () {
            const taskId = this.getAttribute("data-id");

            fetch(`/complete_task/${taskId}`, { method: "POST" })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert("Failed to complete task");
                    }
                })
                .catch(error => console.error("Error:", error));
        });
    });

    // Delete task
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            const taskId = this.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this task?")) {
                fetch(`/delete_task/${taskId}`, { method: "DELETE" })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.reload();
                        } else {
                            alert("Failed to delete task");
                        }
                    })
                    .catch(error => console.error("Error:", error));
            }
        });
    });

    // Search functionality
    document.getElementById("search-btn").addEventListener("click", function () {
        const searchTerm = document.getElementById("search-input").value.toLowerCase();
        const taskCards = document.querySelectorAll(".task-card");

        taskCards.forEach(card => {
            const title = card.querySelector(".task-title").innerText.toLowerCase();
            const category = card.querySelector(".task-category").innerText.toLowerCase();

            if (title.includes(searchTerm) || category.includes(searchTerm)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });

    // Chart.js - Task Categories
    const ctx = document.getElementById("taskChart").getContext("2d");

    fetch("/task_categories")
        .then(response => response.json())
        .then(data => {
            const categories = Object.keys(data);
            const counts = Object.values(data);

            new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: categories,
                    datasets: [{
                        label: "Task Categories",
                        data: counts,
                        backgroundColor: ["#ff6384", "#36a2eb", "#ffcd56", "#4bc0c0"],
                    }]
                },
            });
        })
        .catch(error => console.error("Error fetching category data:", error));
});
