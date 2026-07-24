"""
Direct MySQL → SQL Server migration using Python.
Reads schema + data from MySQL, creates tables and inserts into SQL Server.
"""
import pyodbc
import pymysql
import sys
import os

MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASS = "89254028Kk.@"
MYSQL_DB = "triple_fusion_engine"

MSSQL_CONN = (
    r"DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=localhost,3570;"
    r"Trusted_Connection=yes;"
)

TYPE_MAP = {
    "int": "INT",
    "bigint": "BIGINT",
    "smallint": "SMALLINT",
    "tinyint": "TINYINT",
    "tinyint(1)": "BIT",
    "float": "FLOAT",
    "double": "FLOAT",
    "decimal": "DECIMAL",
    "varchar": "VARCHAR",
    "char": "CHAR",
    "text": "NVARCHAR(MAX)",
    "mediumtext": "NVARCHAR(MAX)",
    "longtext": "NVARCHAR(MAX)",
    "datetime": "DATETIME2",
    "timestamp": "DATETIME2",
    "date": "DATE",
    "time": "TIME",
    "enum": "VARCHAR(50)",
    "json": "NVARCHAR(MAX)",
}

RESERVED = {"key", "user", "read", "plan", "status", "role", "name", "value"}

def bracket(name):
    """Bracket SQL Server reserved words."""
    if name.lower() in RESERVED:
        return f"[{name}]"
    return name

def mysql_type_to_mssql(col_type, col_type_full):
    """Convert MySQL column type to SQL Server type."""
    t = col_type.lower()
    if t == "tinyint" and "tinyint(1)" in col_type_full.lower():
        return "BIT"
    if t in TYPE_MAP:
        return TYPE_MAP[t]
    return col_type

def migrate():
    # Connect MySQL
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST, port=MYSQL_PORT,
        user=MYSQL_USER, password=MYSQL_PASS,
        database=MYSQL_DB, charset="utf8mb4"
    )
    mysql_cur = mysql_conn.cursor()

    # Connect SQL Server
    mssql_conn = pyodbc.connect(MSSQL_CONN, autocommit=True)
    mssql_cur = mssql_conn.cursor()

    # Use existing database
    mssql_cur.execute("USE [triple_fusion_engine]")

    # Get all tables
    mysql_cur.execute("SHOW TABLES")
    tables = [row[0] for row in mysql_cur.fetchall()]

    created = 0
    total_rows = 0

    for tbl in tables:
        print(f"\n--- {tbl} ---")

        # Get columns
        mysql_cur.execute(f"SHOW COLUMNS FROM `{tbl}`")
        cols = mysql_cur.fetchall()
        # SHOW COLUMNS: Field, Type, Null, Key, Default, Extra

        col_defs = []
        col_names = []
        col_names_bracket = []
        pk_col = None
        has_identity = False

        for col in cols:
            field, col_type, null, key, default, extra = col
            col_names.append(field)
            col_names_bracket.append(bracket(field))

            mssql_type = mysql_type_to_mssql(col_type, col_type)
            nullable = "NULL" if null == "YES" else "NOT NULL"

            # Handle AUTO_INCREMENT
            if extra and "auto_increment" in extra.lower():
                mssql_type = f"{mssql_type} IDENTITY(1,1)"
                has_identity = True

            # Handle defaults
            default_clause = ""
            if default is not None:
                if default == "CURRENT_TIMESTAMP":
                    default_clause = "DEFAULT GETDATE()"
                elif isinstance(default, str):
                    default_clause = f"DEFAULT '{default}'"
                else:
                    default_clause = f"DEFAULT {default}"

            col_def = f"  {bracket(field)} {mssql_type} {nullable} {default_clause}".strip()
            col_defs.append(col_def)

            if key == "PRI":
                pk_col = field

        # Add PRIMARY KEY
        if pk_col:
            col_defs.append(f"  PRIMARY KEY ({bracket(pk_col)})")

        # Also add UNIQUE constraints from MySQL (handles composite keys)
        mysql_cur.execute(f"SHOW INDEX FROM `{tbl}` WHERE Non_unique = 0 AND Key_name != 'PRIMARY'")
        unique_indexes = mysql_cur.fetchall()
        # Group columns by key_name
        from collections import OrderedDict
        unique_groups = OrderedDict()
        for idx in unique_indexes:
            key_name = idx[2]
            column = idx[4]
            seq = idx[3]  # Seq_in_index
            if key_name not in unique_groups:
                unique_groups[key_name] = []
            unique_groups[key_name].append((seq, column))
        for key_name, cols in unique_groups.items():
            cols.sort(key=lambda x: x[0])
            col_list = ", ".join(bracket(c) for _, c in cols)
            col_defs.append(f"  CONSTRAINT UQ_{tbl}_{key_name} UNIQUE ({col_list})")

        create_sql = f"CREATE TABLE {bracket(tbl)} (\n" + ",\n".join(col_defs) + "\n)"
        print(create_sql)

        try:
            mssql_cur.execute(f"IF OBJECT_ID('{bracket(tbl)}', 'U') IS NOT NULL DROP TABLE {bracket(tbl)}")
            mssql_cur.execute(create_sql)
            created += 1
        except Exception as e:
            print(f"  ERROR creating table: {e}")
            continue

        # Import data
        mysql_cur.execute(f"SELECT * FROM `{tbl}`")
        rows = mysql_cur.fetchall()

        if not rows:
            print(f"  0 rows")
            continue

        # Enable IDENTITY_INSERT if needed
        if has_identity:
            mssql_cur.execute(f"SET IDENTITY_INSERT {bracket(tbl)} ON")

        # Build INSERT
        placeholders = ", ".join(["?" for _ in col_names])
        cols_sql = ", ".join(col_names_bracket)
        insert_sql = f"INSERT INTO {bracket(tbl)} ({cols_sql}) VALUES ({placeholders})"

        # Batch insert in groups of 100
        batch_size = 100
        total_batches = (len(rows) + batch_size - 1) // batch_size

        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]
            try:
                mssql_cur.executemany(insert_sql, batch)
            except Exception as e:
                print(f"  ERROR batch {i//batch_size}: {e}")
                # Try row-by-row for error isolation
                for j, row in enumerate(batch):
                    try:
                        mssql_cur.execute(insert_sql, row)
                    except Exception as e2:
                        print(f"    Row {i+j} error: {e2} — data: {row[:3]}...")

        if has_identity:
            mssql_cur.execute(f"SET IDENTITY_INSERT {bracket(tbl)} OFF")

        print(f"  {len(rows)} rows ({total_batches} batches)")
        total_rows += len(rows)

    mysql_cur.close()
    mysql_conn.close()
    mssql_cur.close()
    mssql_conn.close()

    print(f"\n{'='*50}")
    print(f"MIGRATION COMPLETE: {created} tables, {total_rows} rows")

if __name__ == "__main__":
    migrate()
