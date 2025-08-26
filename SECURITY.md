# 🔒 Security Guidelines for CMS

## ⚠️ CRITICAL SECURITY NOTICE

**NEVER commit actual API keys, database URIs, or secrets to version control!**

## 🛡️ Environment Variables Security

### Required Backend Environment Variables
All these variables MUST be set in your `.env` file:

```bash
# Required for basic functionality
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_32_plus_character_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Optional but recommended
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret
```

### Frontend Environment Variables
Only `VITE_` prefixed variables are exposed to the browser:

```bash
# Safe for browser exposure
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_public_key_id
VITE_CASHFREE_APP_ID=your_cashfree_public_app_id
```

## 🔐 Security Best Practices

### 1. Environment Setup
```bash
# Copy example files and fill with actual values
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Ensure .env files are in .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. Generate Secure Secrets
```bash
# Generate secure JWT secret (64 bytes = 128 hex characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Security
- Use MongoDB Atlas or secure your local MongoDB instance
- Create database-specific users with minimal required permissions
- Enable authentication and use strong passwords
- Use connection strings without embedded credentials when possible

### 4. Payment Gateway Security
- Use test/sandbox keys during development
- Switch to production keys only in production environment
- Regularly rotate API keys
- Enable webhook signature verification
- Monitor for suspicious payment activities

### 5. Production Security Checklist
- [ ] All environment variables are set via secure deployment platform
- [ ] No hardcoded secrets in code
- [ ] HTTPS enabled for all environments
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Audit logging enabled
- [ ] Regular security updates applied

## 🚨 What to Do If Credentials Are Compromised

### Immediate Actions:
1. **Rotate compromised credentials immediately**
2. **Check recent transactions for suspicious activity**
3. **Update all deployment environments**
4. **Monitor logs for unauthorized access**
5. **Notify your team and stakeholders**

### Razorpay Compromise:
1. Login to Razorpay Dashboard
2. Regenerate API keys immediately
3. Update webhook secrets
4. Review recent transactions
5. Contact Razorpay support if needed

### Database Compromise:
1. Change database passwords immediately
2. Review database access logs
3. Check for data modification/extraction
4. Consider database migration if severely compromised

### JWT Secret Compromise:
1. Change JWT_SECRET immediately
2. This will invalidate all existing user sessions
3. Users will need to log in again
4. Monitor for unauthorized access attempts

## 📋 Regular Security Maintenance

### Weekly:
- Review access logs for suspicious activities
- Check for failed login attempts
- Monitor payment gateway transactions

### Monthly:
- Update dependencies for security patches
- Review and rotate API keys if needed
- Audit user access permissions
- Review server security configurations

### Quarterly:
- Full security audit
- Penetration testing (if applicable)
- Review and update security policies
- Database security assessment

## 🔍 Monitoring and Alerts

Set up monitoring for:
- Failed authentication attempts
- Unusual payment patterns
- Database connection failures
- API rate limit breaches
- Error rate spikes

## 📞 Security Incident Response

### Contact Information:
- **Internal Team**: [Your team contact]
- **Razorpay Support**: https://razorpay.com/support/
- **Cashfree Support**: https://cashfree.com/support
- **MongoDB Support**: https://www.mongodb.com/support

### Incident Documentation:
Always document security incidents including:
- Timeline of events
- Actions taken
- Impact assessment
- Lessons learned
- Prevention measures implemented

---

**Remember: Security is everyone's responsibility!**
