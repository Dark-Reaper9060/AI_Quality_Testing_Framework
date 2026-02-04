import os
from dotenv import load_dotenv
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

APP_DB_PATH = os.getenv("APP_DB_PATH") +"/users.db"

# ----------------- User Constructor -------------
class User:
    def __init__(self, username, password_hash, role = "user"):
        self.username = username
        self.password_hash = password_hash
        self.role = role
        
# Create User table -----------------------

    @classmethod
    def create_table(cls):
        conn = sqlite3.connect(APP_DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
            )
        """)

        conn.commit()
        conn.close()
        
#  User Model Methods -------------------

    @classmethod
    def create(cls, username, raw_password, role="user"):
        """
        Create a user with specified role (defaults to 'user').
        Raises sqlite3.IntegrityError if username exists.
        """
        print("PasswordL :", raw_password)
        password_hash = generate_password_hash(raw_password)
        conn = sqlite3.connect(APP_DB_PATH)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, password_hash, role)
        )
        conn.commit()
        conn.close()
        return User(username=username, password_hash=password_hash, role=role)  

    @classmethod  # Fetch users
    def fetch_users(cls):

        conn = sqlite3.connect(APP_DB_PATH)
        cur = conn.cursor()
        cur.execute(
            "SELECT username, role FROM users WhERE role is not 'procurement_manager'"
        )
        rows = cur.fetchall()
        conn.close()

        users_data = []
        for row in rows:
            users_data.append((row))

        return users_data
    
    @classmethod
    def find_by_username(cls, username):

        
        conn = sqlite3.connect(APP_DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT username, password_hash, role FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        conn.close()
        if row:
            return User(username=row[0], password_hash=row[1], role=row[2])
        return None
    
    
    def verify_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)
    
    def to_dict(self):
        return {"username": self.username, "role": self.role}