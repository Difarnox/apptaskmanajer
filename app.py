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
    if request.method == 'GET':
        return render_template('forgot_password.html')  # Tampilkan halaman forgot password

    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'success': False, 'error': 'Email harus diisi!'}), 400

        user = mongo.db.users.find_one({"email": email})

        print(f"[FORGOT PASSWORD ATTEMPT] Email: {email}")  # Debugging

        if user:
            return jsonify({'success': True, 'message': 'Email ditemukan! Silakan reset password.', 'email': email}), 200
        else:
            return jsonify({'success': False, 'error': 'Email tidak ditemukan!'}), 404
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'error': 'Terjadi kesalahan server!'}), 500
        
# === Reset Password ===
@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'GET':
        email = request.args.get('email')

        # 🔹 Validasi apakah email ada di parameter
        if not email:
            return "Email tidak valid!", 400

        return render_template('reset_password.html', email=email)

    try:
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('new_password')

        # 🔹 Validasi input
        if not email or not new_password:
            return jsonify({'success': False, 'error': 'Email dan password baru harus diisi!'}), 400

        user = mongo.db.users.find_one({"email": email})
        if not user:
            return jsonify({'success': False, 'error': 'Email tidak ditemukan!'}), 404

        # 🔹 Hash password baru
        hashed_password = generate_password_hash(new_password)

        # 🔹 Update password di database
        result = mongo.db.users.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )

        # 🔹 Cek apakah password berhasil diperbarui
        if result.modified_count > 0:
            return jsonify({'success': True, 'message': 'Password berhasil diperbarui!'}), 200
        else:
            return jsonify({'success': False, 'error': 'Password baru harus berbeda dari password lama!'}), 400

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'error': 'Terjadi kesalahan server!'}), 500

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

# === TOGGLE TASK STATUS ===
@app.route('/toggle_task/<task_id>', methods=['POST'])
def toggle_task(task_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    task = mongo.db.tasks.find_one({"_id": ObjectId(task_id), "user_id": ObjectId(session['user_id'])})
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    new_status = not task.get("completed", False)
    mongo.db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": new_status}}
    )

    return jsonify({'success': True, 'completed': new_status})

# === DELETE TASK ===
@app.route('/delete_task/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    result = mongo.db.tasks.delete_one({
        "_id": ObjectId(task_id),
        "user_id": ObjectId(session['user_id'])
    })

    if result.deleted_count == 0:
        return jsonify({'error': 'Task not found or unauthorized'}), 404

    return jsonify({'success': True})

# === AMBIL TASK BERDASARKAN KATEGORI ===
@app.route("/task_categories")
def task_categories():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'})

    categories = mongo.db.tasks.aggregate([
        {"$match": {"user_id": ObjectId(session['user_id'])}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ])
    
    category_data = {c["_id"]: c["count"] for c in categories if c["_id"]}
    return jsonify(category_data)

# === SEARCH TASKS ===
@app.route('/search-tasks')
def search_tasks():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'User not logged in'})

    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({'success': False, 'tasks': []})

    tasks = list(mongo.db.tasks.find({
        "user_id": ObjectId(session['user_id']),
        "title": {"$regex": query, "$options": "i"}
    }))

    for task in tasks:
        task["_id"] = str(task["_id"])
        task["deadline"] = task["deadline"].strftime('%Y-%m-%d') if task["deadline"] else None

    return jsonify({'success': True, 'tasks': tasks})

# === HALAMAN UNDER CONSTRUCTION ===
@app.route('/under_construction')
def under_construction():
    return render_template('under_construction.html')

if __name__ == '__main__':
    app.run(debug=True)
