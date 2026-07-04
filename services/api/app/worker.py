from celery import Celery

from app.config import settings

celery_app = Celery("neuroloom", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]


@celery_app.task
def send_reminder(circle_id: str, message: str):
    """Placeholder for SMS/email reminders via Twilio/Resend."""
    return {"circle_id": circle_id, "message": message, "sent": True}
