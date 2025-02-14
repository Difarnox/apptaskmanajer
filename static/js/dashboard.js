document.addEventListener("DOMContentLoaded", function () {
    fetchTasks(); // Ambil daftar tugas saat halaman dimuat
    fetchTaskStats(); // Ambil statistik tugas
    setupEventListeners(); // Pasang event listener
});

// === FETCH SEMUA TASK ===
function fetchTasks() {
    fetch("/tasks")
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderTasks(data.tasks);
            } else {
                console.error("Gagal mengambil tugas:", data.error);
            }
        })
        .catch(error => console.error("Error fetching tasks:", error));
}

// === TAMPILKAN SEMUA TASK DI DASHBOARD ===
function renderTasks(tasks) {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = ""; // Kosongkan daftar tugas sebelum menambahkan baru

    if (tasks.length === 0) {
        taskList.innerHTML = "<p>Tidak ada tugas.</p>";
        return;
    }

    tasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.classList.add("task-item");
        if (task.completed) taskItem.classList.add("completed");

        taskItem.innerHTML = `
            <h3>${task.title}</h3>
            <p><strong>Kategori:</strong> ${task.category || "Tidak ada"}</p>
            <p><strong>Prioritas:</strong> ${task.priority || "Normal"}</p>
            <p><strong>Deadline:</strong> ${task.deadline || "Tidak ditentukan"}</p>
            <p>${task.description}</p>
            <button class="mark-done" data-task-id="${task._id}">${task.completed ? "Undo" : "Mark as Done"}</button>
            <button class="delete-task" data-task-id="${task._id}">Hapus</button>
        `;

        taskList.appendChild(taskItem);
    });

    // Reattach event listeners setelah tugas diperbarui
    attachTaskEventListeners();
}

// === MARK TASK AS DONE / UNDO ===
function toggleTaskCompletion(taskId, button) {
    fetch(`/toggle-task/${taskId}`, { method: "POST" })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                button.textContent = data.completed ? "Undo" : "Mark as Done";
                button.closest(".task-item").classList.toggle("completed");
                fetchTaskStats(); // Update statistik setelah mengubah status tugas
            } else {
                console.error("Gagal memperbarui tugas:", data.error);
            }
        })
        .catch(error => console.error("Error updating task:", error));
}

// === DELETE TASK ===
function deleteTask(taskId, taskItem) {
    fetch(`/delete_task/${taskId}`, { method: "DELETE" })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                taskItem.remove(); // Hapus elemen tugas dari UI
                fetchTaskStats(); // Perbarui statistik setelah menghapus tugas
            } else {
                console.error("Gagal menghapus tugas:", data.error);
            }
        })
        .catch(error => console.error("Error deleting task:", error));
}

// === SEARCH TASKS ===
function searchTasks(query) {
    fetch(`/search-tasks?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderTasks(data.tasks);
            } else {
                console.error("Gagal mencari tugas:", data.error);
            }
        })
        .catch(error => console.error("Error searching tasks:", error));
}

// === AMBIL STATISTIK TASK ===
function fetchTaskStats() {
    fetch("/task-stats")
        .then(response => response.json())
        .then(data => {
            document.getElementById("work-count").textContent = data.Work || 0;
            document.getElementById("personal-count").textContent = data.Personal || 0;
            document.getElementById("study-count").textContent = data.Study || 0;
            document.getElementById("other-count").textContent = data.Other || 0;
        })
        .catch(error => console.error("Error fetching stats:", error));
}

// === PASANG EVENT LISTENERS ===
function setupEventListeners() {
    // Search event
    document.getElementById("search-input").addEventListener("input", function () {
        searchTasks(this.value);
    });

    // Tambah Task
    document.getElementById("add-task-form").addEventListener("submit", function (event) {
        event.preventDefault();
        addNewTask();
    });

    attachTaskEventListeners();
}

// === EVENT LISTENER UNTUK TOMBOL DI TASK LIST ===
function attachTaskEventListeners() {
    document.querySelectorAll(".mark-done").forEach(button => {
        button.addEventListener("click", function () {
            toggleTaskCompletion(this.dataset.taskId, this);
        });
    });

    document.querySelectorAll(".delete-task").forEach(button => {
        button.addEventListener("click", function () {
            const taskItem = this.closest(".task-item");
            deleteTask(this.dataset.taskId, taskItem);
        });
    });
}

// === TAMBAH TASK BARU ===
function addNewTask() {
    const formData = new FormData(document.getElementById("add-task-form"));
    const newTask = {
        title: formData.get("title"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        deadline: formData.get("deadline"),
        description: formData.get("description"),
    };

    fetch("/add-task", {
        method: "POST",
        body: JSON.stringify(newTask),
        headers: { "Content-Type": "application/json" }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                fetchTasks(); // Refresh daftar tugas setelah menambahkan
                document.getElementById("add-task-form").reset(); // Reset form
                fetchTaskStats(); // Update statistik
            } else {
                console.error("Gagal menambahkan tugas:", data.error);
            }
        })
        .catch(error => console.error("Error adding task:", error));
}
