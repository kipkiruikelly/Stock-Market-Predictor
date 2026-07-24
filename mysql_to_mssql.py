"""
mysql_to_mssql.py — Convert a MySQL mysqldump to T-SQL (SQL Server).
"""
import re
import os

def convert_dump(input_path: str, output_path: str, db_name: str = "triple_fusion_engine"):
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")
    out = []

    out.append(f"-- Converted from MySQL dump to T-SQL")
    out.append(f"USE [master];")
    out.append(f"GO")
    out.append(f"IF DB_ID('{db_name}') IS NOT NULL DROP DATABASE [{db_name}];")
    out.append(f"GO")
    out.append(f"CREATE DATABASE [{db_name}];")
    out.append(f"GO")
    out.append(f"USE [{db_name}];")
    out.append(f"GO")
    out.append("")

    inside_create = False
    create_lines = []

    for line in lines:
        # Skip MySQL headers
        if any(line.startswith(s) for s in [
            "-- MySQL dump", "-- Host:", "-- Server version",
            "-- Dump completed", "mysqldump:",
        ]) or any(kw in line for kw in [
            "/*!40", "/*!50", "/*!40101", "/*!40103", "/*!40014",
            "/*!40111", "SET @@", "SET SQL_MODE", "SET CHARACTER_SET",
            "SET NAMES ", "SET TIME_ZONE", "SET UNIQUE_CHECKS",
            "SET FOREIGN_KEY_CHECKS", "SET SQL_NOTES", "SET AUTOCOMMIT",
        ]):
            continue

        # Skip LOCK/UNLOCK
        if line.strip().startswith(("LOCK TABLES", "UNLOCK TABLES")):
            continue

        # Skip MySQL conditional comments
        if re.match(r'/\*!\d{5}\s', line.strip()):
            continue

        # Handle DROP TABLE (skip — we emit our own DROP before each CREATE TABLE)
        if line.strip().startswith("DROP TABLE IF EXISTS"):
            continue

        # Start of CREATE TABLE
        if line.strip().startswith("CREATE TABLE"):
            inside_create = True
            create_lines = [line.rstrip("\n")]
            continue

        if inside_create:
            stripped = line.rstrip("\n")
            create_lines.append(stripped)

            # Check if this CREATE TABLE block is complete
            # Either the line contains ") ENGINE=" or we've accumulated
            # lines and this one ends with ";" after the engine clause
            full_text = "\n".join(create_lines)
            if ") ENGINE=" in stripped or (stripped.strip().endswith(";") and "ENGINE=" in full_text):
                # Got the full CREATE TABLE
                m = re.search(r"CREATE TABLE `(\w+)`", full_text)
                if not m:
                    inside_create = False
                    continue
                tbl = m.group(1)

                # Strip backticks
                full_text = full_text.replace("`", "")

                # Remove ENGINE + everything after it up to the ;
                full_text = re.sub(r'\s*\)\s*ENGINE=.*?;', ');', full_text, flags=re.DOTALL)

                # Remove AUTO_INCREMENT table option
                full_text = re.sub(r'AUTO_INCREMENT=\d+', '', full_text)
                full_text = re.sub(r'DEFAULT CHARSET=\w+', '', full_text)
                full_text = re.sub(r'COLLATE=\w+', '', full_text)

                # Convert AUTO_INCREMENT column attribute
                full_text = re.sub(r'(\w+)\s+int\s+NOT NULL AUTO_INCREMENT', r'\1 INT IDENTITY(1,1) NOT NULL', full_text)
                full_text = re.sub(r'(\w+)\s+bigint\s+NOT NULL AUTO_INCREMENT', r'\1 BIGINT IDENTITY(1,1) NOT NULL', full_text)

                # Type conversions
                full_text = re.sub(r'\btinyint\(1\)', 'BIT', full_text)
                full_text = re.sub(r'\btinyint\(\d+\)', 'TINYINT', full_text)
                full_text = re.sub(r'\bsmallint\(\d+\)', 'SMALLINT', full_text)
                full_text = re.sub(r'\bint\(\d+\)', 'INT', full_text)
                full_text = re.sub(r'\bbigint\(\d+\)', 'BIGINT', full_text)
                full_text = re.sub(r'\bdouble\b', 'FLOAT', full_text)
                full_text = re.sub(r'\btimestamp\b', 'DATETIME2', full_text)
                # datetime → DATETIME2 (but be careful not to double-convert)
                full_text = re.sub(r'\bdatetime\b', 'DATETIME2', full_text)
                full_text = re.sub(r'\btext\b', 'NVARCHAR(MAX)', full_text)
                full_text = re.sub(r'\bmediumtext\b', 'NVARCHAR(MAX)', full_text)
                full_text = re.sub(r'\blongtext\b', 'NVARCHAR(MAX)', full_text)
                full_text = re.sub(r'\benum\([^)]+\)', 'VARCHAR(50)', full_text)

                # UNIQUE KEY → CONSTRAINT (after backtick removal)
                full_text = re.sub(r'UNIQUE KEY (\w+) \(', r'CONSTRAINT UQ_\1 UNIQUE (', full_text)
                # Drop plain INDEX/KEY lines (but not PRIMARY KEY or UNIQUE KEY)
                full_text = re.sub(r'(?<!PRIMARY )KEY (\w+) \(.*?\),?\n?', '', full_text)

                # Drop FOREIGN KEY constraints (table ordering issues; SQLAlchemy handles in code)
                full_text = re.sub(r',?\s*CONSTRAINT \w+ FOREIGN KEY \(.*?\) REFERENCES .*?(?=,|\n|\))', '', full_text)

                # Bracket SQL Server reserved words in DDL (not in string values)
                for word in ['key', 'user', 'read']:
                    full_text = re.sub(rf'(?<!\w)(?<!\[){word}(?!\w)(?!\])', rf'[{word}]', full_text)

                # CURRENT_TIMESTAMP → GETDATE()
                full_text = re.sub(r'DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'DEFAULT GETDATE()', full_text)
                full_text = re.sub(r'DEFAULT CURRENT_TIMESTAMP', 'DEFAULT GETDATE()', full_text)
                full_text = re.sub(r'ON UPDATE CURRENT_TIMESTAMP', '', full_text)

                # Remove string quotes from numeric defaults (MySQL quirk)
                full_text = re.sub(r"(?i)(int|float|bigint|smallint|tinyint|bit)\s+DEFAULT\s+'(\d+(\.\d+)?)'", r"\1 DEFAULT \2", full_text)

                # Clean up extra commas before closing paren
                full_text = re.sub(r',\s*\n\s*\)', '\n)', full_text)

                out.append(f"IF OBJECT_ID('[{tbl}]', 'U') IS NOT NULL DROP TABLE [{tbl}];")
                out.append("GO")
                out.append(full_text.strip())
                out.append("GO")
                out.append("")

                inside_create = False
                create_lines = []
            continue

        # INSERT statements
        if line.strip().startswith("INSERT INTO"):
            fixed = line.strip()
            fixed = fixed.replace("`", "")
            fixed = fixed.replace("\\'", "''")
            fixed = fixed.replace('\\"', '"')
            fixed = fixed.replace("\\n", "' + CHAR(10) + '")
            fixed = fixed.replace("\\r", "' + CHAR(13) + '")
            out.append(fixed)
            out.append("GO")
            continue

    # Post-process: cleanup any double-brackets
    result = "\n".join(out)
    result = re.sub(r'\[\[(\w+)\]\]', r'[\1]', result)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(result)

    print(f"Converted: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
    print(f"Output lines: {len(out)}")
    return output_path

if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    inp = os.path.join(base, "triple_fusion_mysql_dump.sql")
    out = os.path.join(base, "triple_fusion_mssql.sql")
    convert_dump(inp, out)
