"""Payment model placeholder."""
from datetime import datetime
from pydantic import Field
from beanie import Document, PydanticObjectId


class Payment(Document):
    user_id: PydanticObjectId
    type: str
    amount: float
    currency: str = "USD"
    status: str = "pending"
    provider: str = "stripe"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "payments"