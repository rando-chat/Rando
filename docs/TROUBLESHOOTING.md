# Troubleshooting Guide

Common issues and their solutions.

## Authentication Issues

### Error: "Invalid login credentials"

**Cause:** Incorrect email or password

**Solution:**
1. Verify email is correct
2. Check caps lock is off
3. Try "Forgot Password" link
4. Check spam folder for verification email

---

### Error: "Email not verified"

**Cause:** User hasn't verified email

**Solution:**
1. Check inbox for verification email
2. Check spam/junk folder
3. Resend verification email from Settings
4. Contact support if no email received

---

### Guest Session Expired

**Cause:** Guest sessions last 24 hours

**Solution:**
1. Create new guest session (auto-created)
2. Or register for permanent account
3. Previous chats are not recoverable

---

## Matching Issues

### Can't Find a Match

**Causes:**
- Low user activity
- Restrictive preferences
- Network issues

**Solutions:**
1. **Expand age range:** Remove or widen restrictions
2. **Add interests:** More interests = larger match pool
3. **Try different times:** Peak hours: 6pm-11pm
4. **Check tier:** Premium users get priority
5. **Refresh page:** May fix stuck queue state

---

### Match Found But No Redirect

**Cause:** JavaScript error or slow connection

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Clear browser cache
4. Try different browser
5. Check internet connection

---

## Chat Issues

### Messages Not Sending

**Causes:**
- Rate limit (10 msgs/minute)
- Content flagged
- Session ended
- Network error

**Solutions:**
1. **Wait 1 minute:** Clear rate limit
2. **Rephrase message:** May be flagged
3. **Check session status:** May have ended
4. **Refresh page:** Reconnect to server
5. **Check internet:** Verify connection

---

### Messages Not Appearing

**Cause:** Realtime connection lost

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Verify internet connection
4. Check Supabase status
5. Try different network

---

### Typing Indicator Not Working

**Cause:** Presence channel disconnected

**Solution:**
1. Refresh page
2. Check network connection
3. Wait a few seconds for reconnection
4. Not critical - messages still work

---

## Payment Issues

### Stripe Checkout Not Loading

**Causes:**
- Network error
- Stripe API down
- Invalid price ID

**Solutions:**
1. Check internet connection
2. Try different browser
3. Disable ad blockers
4. Check Stripe status page
5. Contact support with error message

---

### Payment Successful But Tier Not Updated

**Cause:** Webhook delay or failure

**Solution:**
1. Wait 5 minutes for processing
2. Refresh page
3. Check email for confirmation
4. View Stripe dashboard for status
5. Contact support with session ID

---

### Student Verification Failed

**Causes:**
- Invalid .edu email
- Email already used
- Verification code expired

**Solutions:**
1. **Use valid .edu email:** Must end with .edu or .ac.uk
2. **Check spam folder:** Code may be filtered
3. **Request new code:** Codes expire after 10 minutes
4. **Try different email:** Each email can verify once
5. **Contact support:** With university email

---

### Subscription Not Canceling

**Cause:** Stripe API error or browser issue

**Solution:**
1. Open Billing Portal again
2. Clear browser cache
3. Try different browser
4. Contact Stripe support
5. Email us with subscription ID

---

## Profile Issues

### Profile Picture Not Uploading

**Causes:**
- File too large (>5MB)
- Wrong file type
- Network error
- Storage quota exceeded

**Solutions:**
1. **Compress image:** Use tools like TinyPNG
2. **Use JPG/PNG:** No BMP, TIFF, etc.
3. **Check size:** Must be under 5MB
4. **Try different image:** May be corrupted
5. **Check internet:** Verify connection

---

### Changes Not Saving

**Cause:** Validation error or network issue

**Solution:**
1. Check error message displayed
2. Verify all fields valid:
   - Display name: 1-32 characters
   - Bio: Max 500 characters
   - Interests: Max 20 items
3. Refresh and try again
4. Check browser console
5. Try different browser

---

## Admin Issues

### Can't Access Admin Dashboard

**Cause:** Not admin tier

**Solution:**
1. Verify tier is 'admin' in database
2. Log out and log back in
3. Check RLS policies
4. Contact system administrator

---

### Analytics Not Loading

**Causes:**
- Large dataset
- Database connection error
- Chart library error

**Solutions:**
1. Refresh page
2. Clear browser cache
3. Check browser console
4. Verify Supabase connection
5. Try different date range

---

### User Ban Not Working

**Cause:** RLS policy or database error

**Solution:**
1. Verify admin permissions
2. Check user exists
3. Review error message
4. Check audit log
5. Contact support

---

## Performance Issues

### Site Loading Slowly

**Causes:**
- Poor internet
- Server issues
- Large data transfer

**Solutions:**
1. **Check internet speed:** Use speedtest.net
2. **Clear browser cache:** Ctrl+Shift+Delete
3. **Disable extensions:** May interfere
4. **Try incognito mode:** Fresh session
5. **Different browser:** Compare performance

---

### Chat Lagging

**Causes:**
- Slow connection
- High latency
- Server load

**Solutions:**
1. Refresh page
2. Close other tabs
3. Check network quality
4. Try different network
5. Report if persists

---

## Database Issues

### Error: "Failed to fetch data"

**Causes:**
- Network timeout
- Database offline
- RLS policy blocking

**Solutions:**
1. Refresh page
2. Check Supabase status
3. Verify internet connection
4. Log out and log in
5. Contact support if persists

---

### Error: "Row Level Security policy violation"

**Cause:** Trying to access unauthorized data

**Solution:**
1. Log out and log back in
2. Check account permissions
3. Verify feature access for tier
4. Contact support if legitimate access

---

## Mobile Issues

### App Not Working on Mobile

**Causes:**
- Old browser
- Unsupported device
- JavaScript disabled

**Solutions:**
1. Update browser to latest version
2. Enable JavaScript
3. Clear cache and data
4. Try Chrome or Safari
5. Use desktop version

---

### Touch Gestures Not Working

**Cause:** Browser compatibility

**Solution:**
1. Update mobile browser
2. Try different browser
3. Enable touch events
4. Report device/browser combo

---

## Email Issues

### Not Receiving Emails

**Causes:**
- Wrong email address
- Spam filter
- Email service down
- Delivery delay

**Solutions:**
1. **Check spam/junk folder:** Often filtered
2. **Whitelist sender:** noreply@randochat.com
3. **Verify email correct:** Check for typos
4. **Wait 10 minutes:** May be delayed
5. **Try different email:** Provider may block

---

### Verification Link Expired

**Cause:** Links expire after 24 hours

**Solution:**
1. Request new verification email
2. Click link within 24 hours
3. Check time zone differences
4. Contact support if issues persist

---

## Browser-Specific Issues

### Chrome

**Issue:** Cookies not working

**Solution:**
1. Settings → Privacy → Cookies
2. Allow cookies from randochat.com
3. Disable third-party cookie blocking for site

---

### Safari

**Issue:** Realtime not working

**Solution:**
1. Safari → Preferences → Websites
2. Allow WebSockets for randochat.com
3. Update to latest Safari version

---

### Firefox

**Issue:** CORS errors

**Solution:**
1. Check Enhanced Tracking Protection
2. Disable for randochat.com
3. Clear cookies and cache

---

## Error Codes

### 400 Bad Request
**Meaning:** Invalid request data
**Solution:** Check form inputs, refresh page

### 401 Unauthorized
**Meaning:** Not logged in or session expired
**Solution:** Log in again

### 403 Forbidden
**Meaning:** Insufficient permissions
**Solution:** Verify account tier, contact support

### 404 Not Found
**Meaning:** Resource doesn't exist
**Solution:** Check URL, resource may be deleted

### 429 Too Many Requests
**Meaning:** Rate limit exceeded
**Solution:** Wait 1 minute, slow down requests

### 500 Internal Server Error
**Meaning:** Server error
**Solution:** Refresh page, try later, contact support

---

## Getting Additional Help

### Before Contacting Support

1. **Check this guide:** May have solution
2. **Check browser console:** Note any errors
3. **Try incognito mode:** Rule out extensions
4. **Test different browser:** Isolate issue
5. **Check status page:** status.randochat.com

### When Contacting Support

Include:
- **Browser:** Chrome 120, Safari 17, etc.
- **Device:** Windows 11, iPhone 15, etc.
- **Error message:** Exact text or screenshot
- **Steps to reproduce:** What you did before error
- **Account email:** For lookup
- **Time of issue:** With timezone

### Contact Methods

- **Email:** support@randochat.com
- **Response time:**
  - Free: 48 hours
  - Student: 24 hours
  - Premium: 12 hours

---

## Known Issues

### Current Known Issues

1. **Chat history pagination:** May skip messages
   - **Workaround:** Refresh to reload

2. **Safari typing indicators:** Occasionally don't clear
   - **Workaround:** Refresh page

3. **Mobile autocomplete:** May be disabled in some fields
   - **Workaround:** Type manually

### Planned Fixes

These will be fixed in upcoming releases:
- Real-time reconnection improvements
- Better error messages
- Offline mode support
- PWA installation

---

## Diagnostic Tools

### Browser Console

**Chrome/Firefox:**
- Press F12 or Ctrl+Shift+I
- Click Console tab
- Look for errors (red text)

**Safari:**
- Preferences → Advanced → Show Develop menu
- Develop → Show JavaScript Console

### Network Tab

1. Open Developer Tools (F12)
2. Click Network tab
3. Reproduce issue
4. Check failed requests (red)
5. Screenshot for support

### Clear Cache

**Chrome:**
- Ctrl+Shift+Delete
- Check "Cached images and files"
- Time range: All time
- Clear data

**Firefox:**
- Ctrl+Shift+Delete
- Check "Cache"
- Time range: Everything
- Clear Now

**Safari:**
- Preferences → Privacy
- Manage Website Data
- Remove All

---

## Still Having Issues?

1. Check our FAQ: docs.randochat.com/faq
2. Community forums: community.randochat.com
3. Status page: status.randochat.com
4. Email support: support@randochat.com

We're here to help! 💪
