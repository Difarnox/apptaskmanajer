from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson.objectid import ObjectId
import os

app = Flask(__name__)

# 🔹 Konfigurasi MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI")  # Ambil dari Vercel
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")  # Ambil dari Vercel
mongo = PyMongo(app)

# === SIGNIN ===
@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email dan password harus diisi!'})

        user = mongo.db.users.find_one({"email": email})
        if user and check_password_hash(user["password"], password):
            session['user_id'] = str(user['_id'])  # Simpan sesi pengguna
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Email atau password salah!'})

    return render_template('signin.html')

# === SIGNUP PAGE (GET) ===
@app.route('/signup', methods=['GET'])
def signup_page():
    return render_template('signup.html')  # Pastikan signup.html ada di folder templates

# === SIGNUP FUNCTIONALITY (POST) ===
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(force=True)  # 🔹 Paksa baca JSON dari request
    print(f"📥 Data yang diterima: {data}")  # Debugging: Cek apakah data masuk

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # 🔹 Validasi apakah ada data kosong
    if not username or not email or not password:
        return jsonify({'success': False, 'error': 'Harap isi semua kolom!'}), 400

    # 🔹 Cek apakah email sudah terdaftar
    if mongo.db.users.find_one({"email": email}):
        return jsonify({'success': False, 'error': 'Email sudah terdaftar!'}), 400

    # 🔹 Hash password & simpan ke MongoDB
    hashed_password = generate_password_hash(password)
    mongo.db.users.insert_one({
        "username": username,
        "email": email,
        "password": hashed_password
    })

    print("✅ Registrasi berhasil!")  # Debugging
    return jsonify({'success': True, 'message': 'Registrasi berhasil!'})
    
# === Forgot Password ===
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = mongo.db.users.find_one({"email": email})

        print(f"[FORGOT PASSWORD ATTEMPT] Email: {email}")  # Debugging

        if user:
            return jsonify({'success': True, 'message': 'Email ditemukan! Silakan reset password.', 'email': email})
        else:
            return jsonify({'success': False, 'error': 'Email tidak ditemukan!'})

    return render_template('forgot_password.html')

# === Reset Password ===
@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    email = request.args.get('email')  # Ambil email dari parameter URL

    if request.method == 'POST':
        new_password = request.form.get('new_password')

        if not new_password:
            return jsonify({'success': False, 'error': 'Password baru harus diisi!'})

        hashed_password = generate_password_hash(new_password)

        result = mongo.db.users.update_one(
            {"email": email}, 
            {"$set": {"password": hashed_password}}
        )

        if result.matched_count:
            return jsonify({'success': True, 'message': 'Password berhasil diperbarui!'})
        else:
            return jsonify({'success': False, 'error': 'Gagal memperbarui password! Coba lagi.'})

    return render_template('reset_password.html', email=email)

# === DASHBOARD ===
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('signin'))

    user = mongo.db.users.find_one({"_id": ObjectId(session['user_id'])})
    if not user:
        return redirect(url_for('logout'))  # Logout jika user tidak valid

    tasks = list(mongo.db.tasks.find({"user_id": session['user_id']}))

    # Konversi deadline ke datetime object hanya jika masih dalam bentuk string
    for task in tasks:
        if 'deadline' in task and task['deadline']:
            if isinstance(task['deadline'], str):  # Cek apakah deadline masih string
                try:
                    task['deadline'] = datetime.strptime(task['deadline'], '%Y-%m-%d')
                except ValueError:
                    task['deadline'] = None  # Jika error, set ke None

    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.get('completed', False))
    pending_tasks = total_tasks - completed_tasks

    work_tasks = sum(1 for task in tasks if task.get('category') == 'Work')
    personal_tasks = sum(1 for task in tasks if task.get('category') == 'Personal')
    study_tasks = sum(1 for task in tasks if task.get('category') == 'Study')
    other_tasks = sum(1 for task in tasks if task.get('category') == 'Other')

    today = datetime.today().date()

    # Filter Upcoming Deadlines
    upcoming_tasks = [task for task in tasks if task.get('deadline') and task['deadline'].date() >= today]

    return render_template('dashboard.html', user=user, tasks=tasks,
                           total_tasks=total_tasks, completed_tasks=completed_tasks,
                           pending_tasks=pending_tasks, work_tasks=work_tasks,
                           personal_tasks=personal_tasks, study_tasks=study_tasks,
                           other_tasks=other_tasks, today=today, upcoming_tasks=upcoming_tasks)

# === LOGOUT ===
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('signin'))

# === TAMBAH TASK ===
@app.route('/add-task', methods=['POST'])
def add_task():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'})

    data = request.json
    try:
        deadline = datetime.strptime(data['deadline'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid deadline format!'})

    new_task = {
        "user_id": session['user_id'],  # 🔹 Simpan ID user
        "title": data['title'],
        "category": data['category'],
        "priority": data['priority'],
        "deadline": deadline,
        "description": data['description'],
        "completed": False
    }
    result = mongo.db.tasks.insert_one(new_task)
    new_task["_id"] = str(result.inserted_id)

    return jsonify({'success': True, 'task': new_task})

# === AMBIL SEMUA TASK USER ===
@app.route('/tasks')
def get_tasks():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'})

    # 🔹 Ambil hanya task milik user yang login
    tasks = list(mongo.db.tasks.find({"user_id": session['user_id']}))
    for task in tasks:
        task["_id"] = str(task["_id"])
        task["deadline"] = task["deadline"].strftime('%Y-%m-%d')

    return jsonify({'success': True, 'tasks': tasks})

# === DELETE TASK ===
@app.route('/delete_task/<task_id>', methods=['POST'])
def delete_task(task_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    print(f"🔍 Menerima request DELETE untuk Task ID: {task_id} dari User: {session['user_id']}")  # Debugging

    # 🔹 Hapus task berdasarkan ObjectId
    result = mongo.db.tasks.delete_one({"_id": ObjectId(task_id), "user_id": session['user_id']})

    if result.deleted_count == 0:
        print("⚠️ Task tidak ditemukan atau tidak terhapus.")  # Debugging
        return jsonify({'error': 'Task not found or unauthorized'}), 404

    print("✅ Task berhasil dihapus!")  # Debugging
    return jsonify({'success': True})

# === STATISTIK TASK ===
@app.route("/task-stats")
def task_stats():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'})

    categories = ["Work", "Personal", "Study", "Other"]
    stats = {category: mongo.db.tasks.count_documents({"user_id": session['user_id'], "category": category}) for category in categories}
    return jsonify(stats)

# === HALAMAN UNDER CONSTRUCTION ===
@app.route('/under_construction')
def under_construction():
    return render_template('under_construction.html')

if __name__ == '__main__':
    app.run(debug=True)
