"""Test Neo4j connection."""
from neo4j import GraphDatabase
uri = "neo4j+s://35306dec.databases.neo4j.io"
user = "35306dec"
password = "6fxsHrBDKguffsgm0b9dMSfM9uy0ueqrZM6rvJTSfYY"
driver = GraphDatabase.driver(uri, auth=(user, password), connection_timeout=10)
with driver.session() as session:
    result = session.run("RETURN 1 AS test")
    row = result.single()
    print(f"Connected: {row.get('test') == 1}")
driver.close()
