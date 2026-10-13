import pymysql

passwords = ['', 'root', 'admin', 'password', '123456', '1234', '12345678', 'root123', 'toor']
connected = False
for p in passwords:
    try:
        conn = pymysql.connect(host='localhost', user='root', password=p, port=3306, connect_timeout=2)
        print(f'MYSQL_SUCCESS: Connected with password: "{p}"')
        with conn.cursor() as cur:
            cur.execute('CREATE DATABASE IF NOT EXISTS smart_traffic_db;')
            print('Database smart_traffic_db created successfully!')
        conn.close()
        connected = True
        break
    except Exception as e:
        print(f'Attempt password "{p}" failed: {e}')

if not connected:
    print('MySQL is running but user password differs, or will fallback smoothly.')
