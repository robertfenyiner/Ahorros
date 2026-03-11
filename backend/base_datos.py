from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

RUTA_BASE_DATOS = "sqlite:///./ahorros.db"

motor = create_engine(
    RUTA_BASE_DATOS, connect_args={"check_same_thread": False}
)

SesionLocal = sessionmaker(autocommit=False, autoflush=False, bind=motor)

Base = declarative_base()


def obtener_db():
    db = SesionLocal()
    try:
        yield db
    finally:
        db.close()
