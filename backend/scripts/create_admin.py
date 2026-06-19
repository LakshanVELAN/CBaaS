"""Create super admin user directly in Supabase database."""
import os
import django
from django.contrib.auth.hashers import make_password
import psycopg2

DATABASE_URL = os.environ.get('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Delete existing user with this email
cur.execute("DELETE FROM auth_user WHERE email = 'lakshanraja85@gmail.com'")

pw_hash = make_password('lakshan@12345')
cur.execute(
    "INSERT INTO auth_user (password, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) VALUES (%s, true, %s, '', '', %s, true, true, NOW())",
    (pw_hash, 'lakshanraja85@gmail.com', 'lakshanraja85@gmail.com')
)
conn.commit()

# Verify
cur.execute("SELECT id, username, is_staff, is_superuser FROM auth_user WHERE email = 'lakshanraja85@gmail.com'")
row = cur.fetchone()
print(f"Created user: id={row[0]} user={row[1]} staff={row[2]} super={row[3]}")

cur.close()
conn.close()
