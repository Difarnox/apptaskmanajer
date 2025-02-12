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

# === SIGN IN (LOGIN) ===
@app.route('/', methods=['GET', 'POST'])
def signin():
    if request.method == 'POST':
        try:
            data = request.get_json(force=True)  # Ambil JSON dari request
            email = data.get('email')
            password = data.get('password')
        except:
            return jsonify({'success': False, 'error': 'Invalid request format!'}), 400

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email dan password harus diisi!'}), 400

        user = mongo.db.users.find_one({"email": email})
        if user and check_password_hash(user["password"], password):
            session['user_id'] = str(user['_id'])  # 🔹 Simpan user_id sebagai string
            return jsonify({'success': True})

        return jsonify({'success': False, 'error': 'Email atau password salah!'}), 401

    return render_template('signin.html')

# === SIGN UP (REGISTER) ===
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        if request.is_json:  # Pastikan request adalah JSON
            data = request.get_json()
        else:
            return jsonify({'success': False, 'error': 'Invalid request format!'}), 400

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'success': False, 'error': 'Harap isi semua kolom!'}), 400

        if mongo.db.users.find_one({"email": email}):
            return jsonify({'success': False, 'error': 'Email sudah terdaftar!'}), 400

        hashed_password = generate_password_hash(password)

        mongo.db.users.insert_one({
            "username": username,
            "email": email,
            "password": hashed_password
        })

        return jsonify({'success': True, 'message': 'Registrasi berhasil!'}), 200

    return render_template('signup.html')
    
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

    try:
        user = mongo.db.users.find_one({"_id": ObjectId(session['user_id'])})
    except:
        return redirect(url_for('logout'))  # Logout jika terjadi error parsing ObjectId

    if not user:
        return redirect(url_for('logout'))  # Logout jika user tidak valid

    tasks = list(mongo.db.tasks.find({"user_id": ObjectId(session['user_id'])}))  # 🔹 Ambil task berdasarkan ObjectId

    for task in tasks:
        if 'deadline' in task and task['deadline']:
            if isinstance(task['deadline'], str):  # Jika masih string, konversi ke datetime
                try:
                    task['deadline'] = datetime.strptime(task['deadline'], '%Y-%m-%d')
                except ValueError:
                    task['deadline'] = None

    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.get('completed', False))
    pending_tasks = total_tasks - completed_tasks

    work_tasks = sum(1 for task in tasks if task.get('category') == 'Work')
    personal_tasks = sum(1 for task in tasks if task.get('category') == 'Personal')
    study_tasks = sum(1 for task in tasks if task.get('category') == 'Study')
    other_tasks = sum(1 for task in tasks if task.get('category') == 'Other')

    today = datetime.today().date()

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
        "user_id": ObjectId(session['user_id']),  # 🔹 Konversi user_id ke ObjectId
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

    tasks = list(mongo.db.tasks.find({"user_id": ObjectId(session['user_id'])}))  # 🔹 Gunakan ObjectId

    for task in tasks:
        task["_id"] = str(task["_id"])
        task["deadline"] = task["deadline"].strftime('%Y-%m-%d') if task["deadline"] else None

    return jsonify({'success': True, 'tasks': tasks})

# === DELETE TASK ===
@app.route('/delete_task/<task_id>', methods=['POST'])
def delete_task(task_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        result = mongo.db.tasks.delete_one({
            "_id": ObjectId(task_id), 
            "user_id": ObjectId(session['user_id'])  # 🔹 Pastikan hanya user pemilik yang bisa hapus task
        })
    except:
        return jsonify({'error': 'Invalid Task ID'}), 400

    if result.deleted_count == 0:
        return jsonify({'error': 'Task not found or unauthorized'}), 404

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
