# Security Guide for Lifting Plan App

## 🔐 Security Measures Implemented

### 1. Authentication & Authorization

#### ✅ **Password Security**

- **Bcrypt hashing** with 12 salt rounds (stronger than default 10)
- **Strong password requirements**:
  - Minimum 8 characters
  - Must contain uppercase, lowercase, number, and special character
  - Maximum 128 characters to prevent DoS attacks

#### ✅ **JWT Token Security**

- **Token expiration**: 24 hours
- **Issuer and audience validation**
- **Proper token verification** with error handling
- **Secure token storage** recommendations for frontend

#### ✅ **Role-Based Access Control (RBAC)**

- User roles: `user`, `admin`
- Admin middleware for protected routes
- Proper authorization checks

### 2. Input Validation & Sanitization

#### ✅ **Input Validation**

- **Email validation**: Proper format and length limits
- **Username validation**: 3-30 characters, alphanumeric + hyphens/underscores
- **Password validation**: Strong password requirements
- **Input length limits**: Prevent buffer overflow attacks

#### ✅ **XSS Protection**

- **Input sanitization** middleware using `xss` library
- **Content Security Policy (CSP)** headers
- **Automatic HTML entity encoding**

### 3. Rate Limiting & DoS Protection

#### ✅ **Multi-Layer Rate Limiting**

- **General rate limit**: 1000 requests/15 minutes per IP
- **Auth rate limit**: 10 requests/15 minutes per IP
- **Login rate limit**: 5 attempts/15 minutes per IP (brute force protection)
- **Proper error messages** for rate limit violations

### 4. Security Headers

#### ✅ **Helmet.js Security Headers**

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: HTTPS enforcement
- **Content-Security-Policy**: XSS protection
- **Referrer-Policy**: Controls referrer information

### 5. Transport Security

#### ✅ **HTTPS Configuration**

- **SSL/TLS encryption** for all communications
- **Secure cookie settings** (when implemented)
- **HSTS headers** for browser security

### 6. Error Handling & Logging

#### ✅ **Secure Error Handling**

- **No sensitive data exposure** in error messages
- **Consistent error responses**
- **Development vs production logging**
- **Proper HTTP status codes**

### 7. Database Security

#### ✅ **ORM Security**

- **Prisma ORM** prevents SQL injection
- **Parameterized queries** by default
- **Input validation** before database operations

## 🚨 Additional Security Recommendations

### 1. Environment & Configuration

#### **Environment Variables**

```env
# Required for production
NODE_ENV=production
JWT_SECRET=your-super-secure-random-string-here
JWT_ISSUER=lifting-app
JWT_AUDIENCE=lifting-app-users
DATABASE_URL=your-secure-database-url
FRONTEND_URL=https://yourdomain.com
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt

# Optional security settings
BCRYPT_ROUNDS=12
JWT_EXPIRATION=24h
```

### 2. Database Security

#### **PostgreSQL Security**

```sql
-- Create dedicated database user
CREATE USER lifting_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE lifting_app TO lifting_app;
GRANT USAGE ON SCHEMA public TO lifting_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lifting_app;

-- Enable row-level security (if needed)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 3. Deployment Security

#### **Production Checklist**

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Set up proper firewall rules
- [ ] Use a reverse proxy (nginx/Apache)
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup strategy implementation

### 4. Frontend Security

#### **Client-Side Security**

- Store JWT tokens in `httpOnly` cookies (recommended) or localStorage
- Implement proper logout functionality
- Use CSRF tokens for state-changing operations
- Validate all user inputs on client-side (additional layer)
- Implement proper error handling

### 5. Additional Security Measures

#### **Session Management**

```javascript
// Implement refresh tokens (recommended)
const refreshTokens = new Map(); // Use Redis in production

// Add session revocation
const revokedTokens = new Set(); // Use Redis in production

// Add device/IP tracking
const activeSessions = new Map(); // Use Redis in production
```

#### **API Security**

- Implement API versioning
- Add request/response logging
- Use API keys for service-to-service communication
- Implement webhook signature verification

### 6. Monitoring & Logging

#### **Security Monitoring**

```javascript
// Add security event logging
const securityLogger = require("./utils/securityLogger");

// Log security events
securityLogger.logFailedLogin(ip, email);
securityLogger.logSuspiciousActivity(ip, userAgent);
securityLogger.logPrivilegeEscalation(userId, action);
```

#### **Recommended Tools**

- **Sentry**: Error tracking and performance monitoring
- **Winston**: Logging library
- **Morgan**: HTTP request logger
- **Express-slow-down**: Gradual response delay

## 🚀 Quick Security Setup

### 1. Install Required Packages

```bash
cd server
npm install helmet express-rate-limit validator xss express-validator
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_role_field
```

### 3. Create Admin User

```bash
node createAdmin.js your-email@example.com your-secure-password
```

### 4. Environment Setup

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your secure values
```

### 5. SSL Certificate Setup

```bash
# For development (self-signed)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# For production, use Let's Encrypt or your certificate provider
```

## 📊 Security Testing

### Manual Testing Checklist

- [ ] Test rate limiting on all endpoints
- [ ] Verify JWT token expiration
- [ ] Test password strength requirements
- [ ] Verify XSS protection
- [ ] Test role-based access control
- [ ] Verify HTTPS redirection
- [ ] Test input validation on all forms

### Automated Security Testing

```bash
# Install security testing tools
npm install --save-dev eslint-plugin-security
npm install -g nsp
npm install -g snyk

# Run security audits
npm audit
snyk test
```

## 🔧 Security Maintenance

### Regular Tasks

- [ ] Update all dependencies monthly
- [ ] Review and rotate JWT secrets quarterly
- [ ] Monitor failed login attempts
- [ ] Review admin user accounts
- [ ] Check SSL certificate expiration
- [ ] Backup database regularly
- [ ] Review access logs

### Security Incident Response

1. **Immediate Actions**

   - Revoke compromised tokens
   - Change affected passwords
   - Block suspicious IP addresses
   - Notify affected users

2. **Investigation**

   - Review access logs
   - Identify attack vectors
   - Assess data exposure
   - Document incident

3. **Recovery**
   - Patch vulnerabilities
   - Implement additional controls
   - Monitor for reoccurrence
   - Update security procedures

## 📞 Security Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js Security Checklist**: https://nodejs.org/en/docs/guides/security/
- **Express Security Best Practices**: https://expressjs.com/en/advanced/best-practice-security.html
- **JWT Best Practices**: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/

---

**Remember**: Security is an ongoing process, not a one-time implementation. Stay updated with security best practices and regularly review your security measures.
