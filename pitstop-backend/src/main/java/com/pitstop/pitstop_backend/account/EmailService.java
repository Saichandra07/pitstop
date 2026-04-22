package com.pitstop.pitstop_backend.account;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = "http://localhost:5173/reset-password?token=" + token;
        String subject = "PitStop — Reset Your Password";
        String body = """
                <div style="font-family: Arial, sans-serif; background: #141414; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 480px;">
                    <h2 style="color: #E63946;">PitStop 🔧</h2>
                    <p>You requested a password reset. Click the button below to set a new password.</p>
                    <p>This link expires in <strong>15 minutes</strong>.</p>
                    <a href="%s"
                       style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                              background: #E63946; color: #ffffff; text-decoration: none;
                              border-radius: 8px; font-weight: bold;">
                        Reset Password
                    </a>
                    <p style="margin-top: 24px; color: #888; font-size: 13px;">
                        If you didn't request this, ignore this email. Your password won't change.
                    </p>
                </div>
                """.formatted(link);

        sendHtmlEmail(toEmail, subject, body);
    }

    public void sendVerificationEmail(String toEmail, String token) {
        String link = "http://localhost:5173/verify-email?token=" + token;
        String subject = "PitStop — Verify Your Email";
        String body = """
                <div style="font-family: Arial, sans-serif; background: #141414; color: #ffffff; padding: 32px; border-radius: 12px; max-width: 480px;">
                    <h2 style="color: #E63946;">PitStop 🔧</h2>
                    <p>Welcome to PitStop! Please verify your email address to activate your account.</p>
                    <p>This link expires in <strong>24 hours</strong>.</p>
                    <a href="%s"
                       style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                              background: #61cd96; color: #141414; text-decoration: none;
                              border-radius: 8px; font-weight: bold;">
                        Verify Email
                    </a>
                    <p style="margin-top: 24px; color: #888; font-size: 13px;">
                        If you didn't create a PitStop account, ignore this email.
                    </p>
                </div>
                """.formatted(link);

        sendHtmlEmail(toEmail, subject, body);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom("pitstopsupport@gmail.com");
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email to " + toEmail, e);
        }
    }
}