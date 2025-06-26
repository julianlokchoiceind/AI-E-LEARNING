"""
Security Monitoring Service
Logs and monitors security events, triggers alerts for suspicious activities
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from ..core.config import settings
from ..core.email import EmailService
import asyncio

logger = logging.getLogger(__name__)

class SecurityMonitor:
    """Monitors and logs security events"""
    
    def __init__(self):
        self.alert_thresholds = {
            'failed_login_attempts': 5,
            'rapid_api_calls': 100,
            'suspicious_file_uploads': 3,
            'sql_injection_attempts': 1,
            'xss_attempts': 1,
            'unauthorized_access': 3,
            'rate_limit_exceeded': 10,
            'invalid_token': 10,
            'password_reset_requests': 5
        }
        self.alert_channels = ['email', 'log']  # Add 'slack', 'sms' when configured
        self.email_service = EmailService()
        self.db = None
    
    async def init_db(self, db_client: AsyncIOMotorClient):
        """Initialize database connection"""
        self.db = db_client[settings.DATABASE_NAME]
    
    async def log_security_event(self, event: Dict):
        """Log security event to database"""
        event_record = {
            'timestamp': datetime.utcnow(),
            'event_type': event['type'],
            'severity': event.get('severity', 'medium'),
            'user_id': event.get('user_id'),
            'ip_address': event.get('ip_address'),
            'details': event.get('details', {}),
            'user_agent': event.get('user_agent'),
            'request_path': event.get('request_path'),
            'request_method': event.get('request_method')
        }
        
        # Log to logger
        logger.warning(f"Security Event: {event['type']} - {event.get('details', {})}")
        
        # Save to database if available
        if self.db:
            await self.db.security_events.insert_one(event_record)
        
        # Check if alert needed
        await self._check_alert_threshold(event['type'], event.get('user_id'), event.get('ip_address'))
    
    async def _check_alert_threshold(self, event_type: str, user_id: Optional[str] = None, ip_address: Optional[str] = None):
        """Check if security alert should be triggered"""
        if not self.db:
            return
        
        # Build query
        query = {
            'event_type': event_type,
            'timestamp': {'$gte': datetime.utcnow() - timedelta(minutes=5)}
        }
        
        if user_id:
            query['user_id'] = user_id
        elif ip_address:
            query['ip_address'] = ip_address
        
        # Count recent events
        count = await self.db.security_events.count_documents(query)
        
        threshold = self.alert_thresholds.get(event_type, 10)
        
        if count >= threshold:
            await self._trigger_alert({
                'type': 'threshold_exceeded',
                'event_type': event_type,
                'count': count,
                'threshold': threshold,
                'user_id': user_id,
                'ip_address': ip_address,
                'timestamp': datetime.utcnow()
            })
    
    async def _trigger_alert(self, alert: Dict):
        """Trigger security alert through configured channels"""
        alert_message = self._format_alert_message(alert)
        
        # Send to configured channels
        for channel in self.alert_channels:
            try:
                if channel == 'email':
                    await self._send_email_alert(alert_message)
                elif channel == 'log':
                    logger.error(f"SECURITY ALERT: {alert_message}")
                elif channel == 'slack':
                    # TODO: Implement Slack integration
                    pass
                elif channel == 'sms':
                    # TODO: Implement SMS integration
                    pass
            except Exception as e:
                logger.error(f"Failed to send alert via {channel}: {str(e)}")
    
    def _format_alert_message(self, alert: Dict) -> str:
        """Format alert message for notification"""
        message = f"""
Security Alert: {alert['type']}

Event Type: {alert['event_type']}
Threshold: {alert['count']} events (limit: {alert['threshold']})
Time Window: Last 5 minutes
Timestamp: {alert['timestamp']}
"""
        
        if alert.get('user_id'):
            message += f"User ID: {alert['user_id']}\n"
        
        if alert.get('ip_address'):
            message += f"IP Address: {alert['ip_address']}\n"
        
        return message
    
    async def _send_email_alert(self, message: str):
        """Send security alert via email"""
        # Send to security team
        await self.email_service.send_security_alert_email(
            to_email=settings.SECURITY_TEAM_EMAIL,
            alert_message=message
        )
    
    async def get_security_summary(self, hours: int = 24) -> Dict:
        """Get security event summary for the specified time period"""
        if not self.db:
            return {}
        
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # Aggregate security events
        pipeline = [
            {'$match': {'timestamp': {'$gte': since}}},
            {'$group': {
                '_id': '$event_type',
                'count': {'$sum': 1},
                'severity_high': {
                    '$sum': {'$cond': [{'$eq': ['$severity', 'high']}, 1, 0]}
                },
                'unique_users': {'$addToSet': '$user_id'},
                'unique_ips': {'$addToSet': '$ip_address'}
            }},
            {'$project': {
                'event_type': '$_id',
                'count': 1,
                'severity_high': 1,
                'unique_users_count': {'$size': '$unique_users'},
                'unique_ips_count': {'$size': '$unique_ips'}
            }}
        ]
        
        results = await self.db.security_events.aggregate(pipeline).to_list(None)
        
        return {
            'period_hours': hours,
            'events': results,
            'total_events': sum(r['count'] for r in results),
            'high_severity_events': sum(r['severity_high'] for r in results)
        }
    
    async def cleanup_old_events(self, days: int = 30):
        """Clean up old security events"""
        if not self.db:
            return
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.security_events.delete_many({
            'timestamp': {'$lt': cutoff_date}
        })
        
        logger.info(f"Cleaned up {result.deleted_count} old security events")

# Global security monitor instance
security_monitor = SecurityMonitor()