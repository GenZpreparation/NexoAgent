"""
NexoAgent - Audio Recording Object Storage Service (AWS S3 & Cloudflare R2 Compatible)
Handles:
1. Secure presigned upload URLs (PUT) for LiveKit/Carrier audio egress
2. Time-limited presigned streaming URLs (GET) for dashboard playback
3. Strict tenant-isolated storage keys (recordings/workspace_{id}/{call_sid}.mp3)
"""
from typing import Optional, Dict, Any
import boto3
from botocore.config import Config
from app.core.config import settings


class RecordingStorageService:
    def __init__(self):
        # S3 Client with Signature Version 4
        s3_kwargs: Dict[str, Any] = {
            "service_name": "s3",
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
            "region_name": settings.S3_REGION_NAME,
            "config": Config(signature_version="s3v4")
        }
        if settings.S3_ENDPOINT_URL:
            s3_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

        self.s3_client = boto3.client(**s3_kwargs)
        self.bucket_name = settings.S3_BUCKET_NAME

    def get_storage_key(self, workspace_id: int, call_sid: str) -> str:
        """
        Tenant-isolated object key create karta hai.
        Pattern: recordings/workspace_{id}/{call_sid}.mp3
        """
        return f"recordings/workspace_{workspace_id}/{call_sid}.mp3"

    def generate_upload_url(self, workspace_id: int, call_sid: str, expires_in: int = 300) -> str:
        """
        Carrier ya LiveKit egress ke liye presigned PUT URL banata hai (valid for 5 mins).
        Is link par koi bhi bina AWS credentials ke direct audio upload kar sakta hai.
        """
        key = self.get_storage_key(workspace_id, call_sid)
        return self.s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key,
                "ContentType": "audio/mpeg"
            },
            ExpiresIn=expires_in
        )

    def generate_streaming_url(self, storage_key_or_url: str, expires_in: int = 900) -> str:
        """
        Frontend audio player ke liye time-limited presigned GET URL banata hai (default 15 mins).
        """
        # Agar key me full URL aa gaya ho to key extract karo
        key = storage_key_or_url
        if f"{self.bucket_name}/" in storage_key_or_url:
            key = storage_key_or_url.split(f"{self.bucket_name}/")[-1]

        return self.s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key
            },
            ExpiresIn=expires_in
        )


recording_storage = RecordingStorageService()
