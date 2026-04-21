from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)
app.json.ensure_ascii = False       # Кирилл үсгийг JSON-д зөв дамжуулах
app.json.sort_keys = False

@app.after_request
def set_charset(response):
    if 'text/html' in response.content_type or 'application/json' in response.content_type:
        response.content_type += '; charset=utf-8'
    return response

# HTML файлууд

@app.route('/')
def index():
    return send_file('../frontend/index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    if filename.endswith('.html'):
        return send_file(f'../frontend/{filename}')
    return app.send_static_file(filename)

# Өгөгдлийн сантай холбогдох функц тодорхойлно.

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


# Authorization — энгийн хэрэглэгч ба админ хоёрын нэвтрэлтийг шалгах функц


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

# Create , Read , Update , Delete (CRUD) үйлдлүүдийг гүйцэтгэх API 

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


# Серверийн ажиллагааг шалгах API

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
