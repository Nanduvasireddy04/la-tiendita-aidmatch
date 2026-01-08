from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    anonymous_handle = Column(String(50), unique=True, index=True, nullable=False)
    city = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    role = Column(String(20), nullable=False)  # individual | group
    preferred_safe_locations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    needs = relationship("Need", back_populates="user")
    offers = relationship("Offer", back_populates="user")

class Need(Base):
    __tablename__ = "needs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    urgency = Column(String(10), nullable=False)  # low | medium | high
    city = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="needs")

class Offer(Base):
    __tablename__ = "offers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Integer, nullable=True)
    city = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="offers")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    need_id = Column(Integer, ForeignKey("needs.id"), nullable=False)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False)
    match_score = Column(Numeric(5, 2), nullable=False, default=0)
    status = Column(String(20), nullable=False, default="suggested")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    mutual_aid_group_name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    region = Column(String(100), nullable=True)
    group_profile = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
