document.addEventListener("DOMContentLoaded", function () {
    // Memuat daftar tugas, grafik, dan tenggat waktu yang akan datang saat halaman dimuat
    fetchTasks();
    updateChart();
    loadUpcomingDeadlines();

    // 🔹 Sidebar Toggle: Menyembunyikan/menampilkan sidebar ketika tombol ditekan
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function () {
            document.querySelector(".sidebar").classList.toggle("hidden");
            document.querySelector(".main-content").classList.toggle("full-width");
        });
    }

    // 🔹 Sidebar Navigation: Mengubah tampilan tab berdasarkan navigasi sidebar
    document.querySelectorAll(".nav-list li, .settings p").forEach(item => {
        item.addEventListener("click", function () {
            let tab = this.getAttribute("data-tab");

            document.querySelectorAll(".tab-content").forEach(content => {
                content.classList.remove("active");
            });

            const activeTab = document.getElementById(tab + "-content");
            if (activeTab) activeTab.classList.add("active");

            if (tab === "logout") {
                window.location.href = "/logout";
            }
        });
    });

    // 🔹 Modal Task: Menampilkan/menghilangkan modal tambah tugas
    const addTaskBtn = document.getElementById("add-task-btn");
    const closeModalBtn = document.getElementById("close-modal");
    const taskModal = document.getElementById("task-modal");

    if (addTaskBtn && taskModal) {
        addTaskBtn.addEventListener("click", () => {
            taskModal.style.display = "flex";
        });
    }

    if (closeModalBtn && taskModal) {
        closeModalBtn.addEventListener("click", (event) => {
            event.preventDefault();
            taskModal.style.display = "none";
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                taskModal.style.display = "none";
            }
        });
    }

    // 🔹 Tambah Tugas Baru
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
        taskForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const submitButton = document.getElementById("add-task-btn");
            submitButton.disabled = true;
            submitButton.textContent = "Loading...";

            let taskData = {
                title: document.getElementById("task-title").value.trim(),
                category: document.getElementById("task-category").value,
                priority: document.getElementById("task-priority").value,
                deadline: document.getElementById("task-deadline").value,
                description: document.getElementById("task-desc").value.trim()
            };

            if (!taskData.title || !taskData.deadline) {
                alert("Title dan Deadline harus diisi!");
                submitButton.disabled = false;
                submitButton.textContent = "Add Task";
                return;
            }

            const deadlineDate = new Date(taskData.deadline);
            if (deadlineDate < new Date()) {
                alert("Deadline tidak boleh tanggal yang sudah lewat!");
                submitButton.disabled = false;
                submitButton.textContent = "Add Task";
                return;
            }

            try {
                let response = await fetch("/add-task", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(taskData)
                });

                let data = await response.json();
                if (data.success) {
                    addTaskToDOM(data.task);
                    taskForm.reset();
                    taskModal.style.display = "none";
                    updateChart();
                    loadUpcomingDeadlines();
                    location.reload();
                } else {
                    alert("Error: " + data.error);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Add Task";
            }
        });
    }

    // 🔹 Ambil Tugas dari Backend
    async function fetchTasks() {
        try {
            let response = await fetch("/tasks");
            let data = await response.json();
            let taskContainer = document.querySelector(".task-container");

            taskContainer.innerHTML = '<p>Loading tasks...</p>';

            if (data.success) {
                taskContainer.innerHTML = "";
                data.tasks.forEach(task => addTaskToDOM(task));
                updateChart();
                loadUpcomingDeadlines();
            } else {
                taskContainer.innerHTML = "<p>Gagal mengambil data tugas.</p>";
                console.error("Failed to fetch tasks:", data.error);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }

    // 🔹 Tambahkan tugas ke DOM
    function addTaskToDOM(task) {
        let taskContainer = document.querySelector(".task-container");

        let taskCard = document.createElement("div");
        taskCard.classList.add("task-card");
        taskCard.innerHTML = `
            <div class="task-header">
                <span class="task-title">${task.title}</span>
                <span class="task-category category-${task.category.toLowerCase()}">${task.category}</span>
            </div>
            <p class="task-info">${task.description || "No description"}</p>
            <p class="task-info">📅 ${formatDate(task.deadline)}</p>
            <div class="task-footer">
                <button class="complete-btn" data-id="${task._id}">
                    ${task.completed ? "✅ Completed" : "✏️ Mark as Done"}
                </button>
                <button class="delete-btn" data-id="${task._id}">🗑 Delete</button>
            </div>
        `;

        taskContainer.appendChild(taskCard);
    }

    // 🔹 Hapus Tugas
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-btn")) {
            const taskId = event.target.getAttribute("data-id");

            fetch(`/delete_task/${taskId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    event.target.closest(".task-card").remove();
                    updateChart();
                    loadUpcomingDeadlines();
                    location.reload();
                } else {
                    alert("Failed to delete task: " + (data.error || "Unknown error"));
                }
            })
            .catch(error => console.error("Error:", error));
        }
    });

    // 🔹 Update Chart.js
    let taskChart;
    async function updateChart() {
        try {
            let response = await fetch("/task_categories");
            let data = await response.json();

            if (!data || Object.keys(data).length === 0) {
                console.warn("No task categories found.");
                return;
            }

            if (taskChart) taskChart.destroy();

            let ctx = document.getElementById("taskChart").getContext("2d");
            taskChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        data: Object.values(data),
                        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
                    }]
                }
            });
        } catch (error) {
            console.error("Error updating chart:", error);
        }
    }

    // 🔹 Search
    document.getElementById("search-input").addEventListener("input", async function () {
        let query = this.value.trim();

        if (query.length === 0) {
            fetchTasks();
            return;
        }

        try {
            let response = await fetch(`/search-tasks?query=${encodeURIComponent(query)}`);
            let data = await response.json();

            let taskContainer = document.querySelector(".task-container");
            taskContainer.innerHTML = "";

            if (data.success && data.tasks.length > 0) {
                data.tasks.forEach(task => addTaskToDOM(task));
            } else {
                taskContainer.innerHTML = "<p>No tasks found.</p>";
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    });
});
