from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import mysql.connector
import os
import uuid

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)
app.json.ensure_ascii = False  
app.json.sort_keys = False

UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/app/uploads")
ALLOWED_EXTENSIONS = {'mp4', 'webm', 'avi', 'mov', 'mkv',
                      'pdf', 'docx', 'doc', 'pptx', 'ppt',
                      'xlsx', 'xls', 'txt', 'zip', 'rar'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.after_request
def set_charset(response):
    if 'text/html' in response.content_type or 'application/json' in response.content_type:
        response.content_type += '; charset=utf-8'
    return response


@app.route('/')
def index():
    return send_file('../frontend/index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    if filename.endswith('.html'):
        return send_file(f'../frontend/{filename}')
    return app.send_static_file(filename)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS




def get_db():
    return mysql.connector.connect(
        host=os.environ.get("DB_HOST", "db"),
        user=os.environ.get("DB_USER", "root"),
        password=os.environ.get("DB_PASSWORD", "rootpassword"),
        database=os.environ.get("DB_NAME", "learning_db"),
        charset='utf8mb4',
        collation='utf8mb4_unicode_ci',
        use_unicode=True,
        init_command='SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci'
    )


def init_db():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lessons (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                course_id     INT NOT NULL,
                title         VARCHAR(255) NOT NULL,
                file_path     VARCHAR(512) NOT NULL,
                file_type     VARCHAR(50)  NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"DB init warning: {e}")

init_db()


ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
USER_USERNAME  = os.environ.get("USER_USERNAME",  "user")
USER_PASSWORD  = os.environ.get("USER_PASSWORD",  "user123")


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return jsonify({"message": "Login successful", "role": "admin"}), 200
    if username == USER_USERNAME and password == USER_PASSWORD:
        return jsonify({"message": "Login successful", "role": "user"}), 200
    return jsonify({"error": "Invalid credentials"}), 401


@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM courses ORDER BY id DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM courses WHERE id = %s", (course_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            return jsonify({"error": "Course not found"}), 404
        return jsonify(row), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/courses', methods=['POST'])
def create_course():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    price = data.get("price")

    if not title or not description or price is None:
        return jsonify({"error": "title, description and price are required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO courses (title, description, price) VALUES (%s, %s, %s)",
            (title, description, float(price))
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"id": new_id, "message": "Course created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    price = data.get("price")

    if not title or not description or price is None:
        return jsonify({"error": "title, description and price are required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE courses SET title=%s, description=%s, price=%s WHERE id=%s",
            (title, description, float(price), course_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found"}), 404
        cursor.close()
        conn.close()
        return jsonify({"message": "Course updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM courses WHERE id = %s", (course_id,))
        conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found"}), 404
        cursor.close()
        conn.close()
        return jsonify({"message": "Course deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
def get_lessons(course_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM lessons WHERE course_id = %s ORDER BY created_at ASC",
            (course_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/courses/<int:course_id>/lessons', methods=['POST'])
def upload_lesson(course_id):
    if 'file' not in request.files:
        return jsonify({"error": "No file exists"}), 400

    file = request.files['file']
    title = request.form.get('title', '').strip()

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not match"}), 400

    original_name = file.filename
    ext = original_name.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))

    if ext in {'mp4', 'webm', 'avi', 'mov', 'mkv'}:
        file_type = 'video'
    elif ext == 'pdf':
        file_type = 'pdf'
    else:
        file_type = 'file'

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO lessons (course_id, title, file_path, file_type, original_name) VALUES (%s, %s, %s, %s, %s)",
            (course_id, title, unique_filename, file_type, original_name)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"id": new_id, "message": "Lesson uploaded"}), 201
    except Exception as e:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
        except OSError:
            pass
        return jsonify({"error": str(e)}), 500


@app.route('/api/lessons/<int:lesson_id>', methods=['DELETE'])
def delete_lesson(lesson_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM lessons WHERE id = %s", (lesson_id,))
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return jsonify({"error": "Lesson not found"}), 404

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], row['file_path'])
        if os.path.exists(file_path):
            os.remove(file_path)

        cursor.execute("DELETE FROM lessons WHERE id = %s", (lesson_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Lesson deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Серверийн ажиллагааг шалгах API

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
