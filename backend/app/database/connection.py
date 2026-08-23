from pymongo import MongoClient

from app.config import settings


client = MongoClient(settings.mongodb_uri)

database = client[settings.database_name]


def get_database():
    return database