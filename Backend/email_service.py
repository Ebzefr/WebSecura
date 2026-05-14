"""
Email Service for WebSecura
Handles sending email alerts for monitoring
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

class EmailService:
    def __init__(self):
        # Email configuration from environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        
        # Flag to check if email is configured
        self.is_configured = bool(self.smtp_username and self.smtp_password)
    
    def send_score_drop_alert(self, to_email, url, old_score, new_score, scan_details):
        """Send email alert when security score drops"""
        if not self.is_configured:
            print("⚠️ Email not configured - skipping alert")
            return False
        
        subject = f"⚠️ Security Score Drop Alert: {url}"
        
        # Calculate drop percentage
        drop = old_score - new_score
        drop_percent = int((drop / old_score) * 100) if old_score > 0 else 0
        
        # HTML email body
        html_body = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                              color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; 
                                  padding: 15px; margin: 20px 0; border-radius: 4px; }}
                    .score {{ font-size: 48px; font-weight: bold; margin: 10px 0; }}
                    .score-drop {{ color: #ef4444; }}
                    .score-good {{ color: #10b981; }}
                    .button {{ background: #10b981; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 6px; display: inline-block; 
                              margin: 20px 0; }}
                    .footer {{ text-align: center; color: #6b7280; font-size: 12px; 
                              margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">🛡️ WebSecura Alert</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Security Score Drop Detected</p>
                    </div>
                    
                    <div class="content">
                        <div class="alert-box">
                            <h2 style="margin-top: 0; color: #ef4444;">⚠️ Security Score Decreased</h2>
                            <p><strong>Website:</strong> {url}</p>
                            <p><strong>Time:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; margin: 0 20px;">
                                <p style="margin: 0; color: #6b7280;">Previous Score</p>
                                <div class="score score-good">{old_score}</div>
                            </div>
                            <div style="display: inline-block; margin: 0 20px;">
                                <p style="margin: 0; color: #6b7280; font-size: 24px;">→</p>
                            </div>
                            <div style="display: inline-block; margin: 0 20px;">
                                <p style="margin: 0; color: #6b7280;">Current Score</p>
                                <div class="score score-drop">{new_score}</div>
                            </div>
                        </div>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">📊 What Changed?</h3>
                            <p><strong>Score dropped by {drop} points ({drop_percent}%)</strong></p>
                            <p>New security issues were detected during the latest scan. 
                               Review the detailed report to see what needs attention.</p>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="https://websecura.com/dashboard" class="button">
                                View Full Report
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding: 15px; background: #eff6ff; 
                                    border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <h4 style="margin-top: 0; color: #1e40af;">💡 Quick Actions</h4>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Review failed security checks</li>
                                <li>Check for recent code deployments</li>
                                <li>Verify SSL certificate status</li>
                                <li>Update security headers</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>You're receiving this because you enabled monitoring for {url}</p>
                        <p>WebSecura - Making your browsing experience safer</p>
                        <p><a href="#" style="color: #6b7280;">Unsubscribe</a> | 
                           <a href="#" style="color: #6b7280;">Manage Preferences</a></p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_body)
    
    def send_weekly_summary(self, to_email, summary_data):
        """Send weekly summary of all monitored sites"""
        if not self.is_configured:
            return False
        
        subject = f"📊 Weekly Security Summary - {summary_data['week']}"
        
        html_body = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                              color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                    .site-card {{ background: white; padding: 15px; margin: 15px 0; 
                                  border-radius: 8px; border-left: 4px solid #10b981; }}
                    .score {{ font-size: 24px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Weekly Security Summary</h1>
                        <p>{summary_data['week']}</p>
                    </div>
                    
                    <div style="padding: 30px; background: #f9fafb;">
                        <h2>Your Monitored Sites</h2>
                        
                        {''.join([f'''
                        <div class="site-card">
                            <h3>{site['url']}</h3>
                            <p><span class="score">{site['score']}/100</span></p>
                            <p>Scans this week: {site['scans']}</p>
                            <p>Status: {site['status']}</p>
                        </div>
                        ''' for site in summary_data['sites']])}
                    </div>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_body)
    
    def _send_email(self, to_email, subject, html_body):
        """Internal method to send email via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Attach HTML body
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    def test_email_config(self, test_email):
        """Test email configuration by sending a test email"""
        if not self.is_configured:
            return False, "Email not configured"
        
        subject = "✅ WebSecura Email Test"
        html_body = """
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>🎉 Email Configuration Successful!</h2>
                <p>Your email settings are working correctly. 
                   You'll receive monitoring alerts at this address.</p>
                <p>- WebSecura Team</p>
            </body>
        </html>
        """
        
        success = self._send_email(test_email, subject, html_body)
        return success, "Test email sent" if success else "Failed to send test email"