import psycopg2

try:
    conn = psycopg2.connect(
        dbname="DocScan",
        user="postgres",
        password="admin",
        host="localhost",
        port="5432"
    )
    print("✅ Connexion PostgreSQL réussie !")
    conn.close()
except Exception as e:
    print(f"❌ Erreur : {e}")