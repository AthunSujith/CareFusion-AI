import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger("notification_service")

class NotificationService:
    @staticmethod
    async def send_email(to_email: str, subject: str, body: str):
        # In local development w/o valid SMTP credentials, just log
        if "your-password" in settings.SMTP_PASSWORD or not settings.SMTP_PASSWORD:
            logger.info(f"mock_email_send: To={to_email}, Subject={subject}")
            logger.info(f"Body: {body}")
            return True

        try:
            msg = MIMEMultipart()
            msg["From"] = settings.FROM_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    @staticmethod
    async def send_activation_email(to_email: str, activation_link: str, user_name: str):
        subject = "Welcome to CareFusion AI - Complete Your Registration"
        body = f"""
        <h1>Welcome, {user_name}!</h1>
        <p>Your account has been verified by our administration team.</p>
        <p>Please click the link below to set your secure password and activate your account:</p>
        <a href="{activation_link}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Activate Account</a>
        <p>This link expires in 24 hours.</p>
        <br>
        <p>Regards,<br>CareFusion Security Team</p>
        """
        return await NotificationService.send_email(to_email, subject, body)

    @staticmethod
    async def send_rejection_notify(to_email: str, reason: str, user_name: str):
        subject = "Update on your CareFusion Application"
        body = f"""
        <p>Dear {user_name},</p>
        <p>We regret to inform you that we could not verify your application at this time.</p>
        <p><strong>Reason:</strong> {reason}</p>
        <p>You may resubmit your application with corrected documents after reviewing our guidelines.</p>
        """
        return await NotificationService.send_email(to_email, subject, body)
