document.addEventListener("DOMContentLoaded", function () {
    fetchTasks();
    updateChart();
    loadUpcomingDeadlines();
    setupSidebarToggle();
    setupSidebarNavigation();
    setupTaskModal();
    setupTaskForm();
    setupSearchFeature();
});

// === SIDEBAR TOGGLE ===
function setupSidebarToggle() {
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function () {
            document.querySelector(".sidebar").classList.toggle("hidden");
            document.querySelector(".main-content").classList.toggle("full-width");
        });
    }
}

// === NAVIGASI SIDEBAR ===
function setupSidebarNavigation() {
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
}

// === MODAL TAMBAH TUGAS ===
function setupTaskModal() {
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
}

// === TAMBAH TUGAS BARU ===
function setupTaskForm() {
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
        taskForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            let taskData = {
                title: document.getElementById("task-title").value.trim(),
                category: document.getElementById("task-category").value,
                priority: document.getElementById("task-priority").value,
                deadline: document.getElementById("task-deadline").value,
                description: document.getElementById("task-desc").value.trim()
            };

            if (!taskData.title || !taskData.deadline) {
                alert("Title dan Deadline harus diisi!");
                return;
            }

            const deadlineDate = new Date(taskData.deadline);
            if (deadlineDate < new Date()) {
                alert("Deadline tidak boleh tanggal yang sudah lewat!");
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
                    document.getElementById("task-modal").style.display = "none";
                    updateChart();
                    loadUpcomingDeadlines();
                } else {
                    alert("Error: " + data.error);
                }
            } catch (error) {
                console.error("Error:", error);
            }
        });
    }
}

// === AMBIL SEMUA TUGAS ===
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
        }
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

// === TAMBAHKAN TUGAS KE DOM ===
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

// === FORMAT TANGGAL ===
function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

// === HAPUS & SELESAIKAN TUGAS DENGAN EVENT DELEGATION ===
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("delete-btn")) {
        const taskId = event.target.getAttribute("data-id");

        let response = await fetch(`/delete_task/${taskId}`, { method: "DELETE" });
        let data = await response.json();

        if (data.success) {
            event.target.closest(".task-card").remove();
            updateChart();
            loadUpcomingDeadlines();
        } else {
            alert("Failed to delete task: " + data.error);
        }
    }

    if (event.target.classList.contains("complete-btn")) {
        const taskId = event.target.getAttribute("data-id");

        let response = await fetch(`/toggle-task/${taskId}`, { method: "POST" });
        let data = await response.json();

        if (data.success) {
            event.target.textContent = data.completed ? "✅ Completed" : "✏️ Mark as Done";
            updateChart();
            loadUpcomingDeadlines();
        } else {
            alert("Failed to update task status: " + data.error);
        }
    }
});

// === UPDATE CHART.JS ===
let taskChart;
async function updateChart() {
    try {
        let response = await fetch("/task-stats");
        let data = await response.json();

        if (taskChart) taskChart.destroy();

        let ctx = document.getElementById("taskChart").getContext("2d");
        taskChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: Object.keys(data),
                datasets: [{ data: Object.values(data), backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"] }]
            }
        });
    } catch (error) {
        console.error("Error updating chart:", error);
    }
}

// === CARI TUGAS ===
function setupSearchFeature() {
    document.getElementById("search-btn").addEventListener("click", async () => {
        let searchTerm = document.getElementById("search-input").value.trim();
        if (!searchTerm) return;

        let response = await fetch(`/search-tasks?query=${encodeURIComponent(searchTerm)}`);
        let data = await response.json();

        let taskContainer = document.querySelector(".task-container");
        taskContainer.innerHTML = data.success ? data.tasks.map(addTaskToDOM).join("") : "<p>Gagal mencari tugas.</p>";
    });
}
