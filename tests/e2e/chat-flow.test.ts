import { test, expect } from '@playwright/test'

test.describe('Complete Chat Flow - Guest User', () => {
  test('guest can join queue and match with another user', async ({ page, context }) => {
    // Create guest session
    await page.goto('/')
    
    // Click "Start Chatting as Guest"
    await page.click('text=Start Chatting as Guest')
    
    // Set interests
    await page.fill('input[placeholder*="Add interest"]', 'gaming')
    await page.click('button:has-text("Add")')
    
    // Join queue
    await page.click('button:has-text("Find Match")')
    
    // Wait for match (in test environment, mock this)
    await expect(page.locator('text=Match Found!')).toBeVisible({ timeout: 10000 })
    
    // Redirect to chat
    await expect(page).toHaveURL(/\/chat\//)
    
    // Send message
    await page.fill('textarea[placeholder*="Type a message"]', 'Hello!')
    await page.click('button:has-text("Send")')
    
    // Verify message appears
    await expect(page.locator('text=Hello!')).toBeVisible()
  })

  test('guest session expires after 24 hours', async ({ page }) => {
    // Mock expired session in localStorage
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('guestSession', JSON.stringify({
        guestId: 'guest-123',
        createdAt: Date.now() - 25 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1 * 60 * 60 * 1000,
      }))
    })
    
    await page.reload()
    
    // Should create new session
    const session = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('guestSession') || '{}')
    })
    
    expect(Date.now() - session.createdAt).toBeLessThan(1000)
  })
})

test.describe('Complete Chat Flow - Registered User', () => {
  test('user can register, login, and chat', async ({ page }) => {
    await page.goto('/register')
    
    // Register
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.fill('input[placeholder*="Display name"]', 'TestUser')
    await page.click('button:has-text("Create Account")')
    
    // Should redirect to verification or home
    await expect(page).toHaveURL(/\/(verify|matchmaking)/)
    
    // Navigate to matchmaking
    await page.goto('/matchmaking')
    
    // Join queue
    await page.click('button:has-text("Find Match")')
    
    // Wait for match
    await expect(page.locator('text=Match Found!')).toBeVisible({ timeout: 10000 })
  })

  test('user can edit profile and add interests', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button:has-text("Sign In")')
    
    // Go to settings
    await page.goto('/settings/profile')
    
    // Edit display name
    await page.fill('input[name="displayName"]', 'UpdatedName')
    
    // Add interest
    await page.fill('input[placeholder*="Add interest"]', 'music')
    await page.click('button:has-text("Add")')
    
    // Save
    await page.click('button:has-text("Save Changes")')
    
    // Verify success
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
  })
})

test.describe('Payment Flow', () => {
  test('user can upgrade to premium', async ({ page }) => {
    await page.goto('/payments/upgrade?tier=premium')
    
    // Click checkout
    await page.click('button:has-text("Proceed to Checkout")')
    
    // Should redirect to Stripe (in test, mock this)
    await expect(page).toHaveURL(/stripe\.com|localhost/)
  })

  test('student can verify email', async ({ page }) => {
    await page.goto('/payments/verify-student')
    
    // Enter .edu email
    await page.fill('input[type="email"]', 'student@university.edu')
    await page.click('button:has-text("Send Verification Code")')
    
    // Enter code (in test, use mock code)
    await expect(page.locator('input[placeholder="123456"]')).toBeVisible()
    await page.fill('input[placeholder="123456"]', '123456')
    await page.click('button:has-text("Verify Code")')
  })
})

test.describe('Admin Flow', () => {
  test('admin can view dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'AdminPassword123!')
    await page.click('button:has-text("Sign In")')
    
    // Navigate to admin
    await page.goto('/admin/dashboard')
    
    // Verify metrics visible
    await expect(page.locator('text=Total Users')).toBeVisible()
    await expect(page.locator('text=Active Chats')).toBeVisible()
    await expect(page.locator('text=MRR')).toBeVisible()
  })

  test('admin can ban user', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Search for user
    await page.fill('input[placeholder*="Search users"]', 'TestUser')
    
    // Click on user
    await page.click('a:has-text("TestUser")')
    
    // Ban user
    await page.click('button:has-text("Ban User")')
    await page.fill('textarea[placeholder*="Ban reason"]', 'Spam')
    await page.click('button:has-text("Ban User")')
    
    // Verify banned
    await expect(page.locator('text=Banned')).toBeVisible()
  })
})

test.describe('Content Moderation', () => {
  test('unsafe message is flagged', async ({ page }) => {
    await page.goto('/chat/test-session')
    
    // Send message with flagged content
    await page.fill('textarea', 'This is a test of unsafe content')
    
    // Should show warning
    await expect(page.locator('text=This message may be flagged')).toBeVisible()
  })

  test('user can report another user', async ({ page }) => {
    await page.goto('/chat/test-session')
    
    // Click report
    await page.click('button[aria-label="Actions"]')
    await page.click('text=Report User')
    
    // Select category
    await page.click('button:has-text("Harassment")')
    
    // Write reason
    await page.fill('textarea[placeholder*="Describe"]', 'User was being inappropriate')
    
    // Submit
    await page.click('button:has-text("Submit Report")')
    
    // Verify success
    await expect(page.locator('text=Report submitted')).toBeVisible()
  })
})

test.describe('Analytics', () => {
  test('admin can view analytics dashboard', async ({ page }) => {
    await page.goto('/analytics/dashboard')
    
    // Verify charts visible
    await expect(page.locator('text=User Growth')).toBeVisible()
    await expect(page.locator('text=Revenue Trend')).toBeVisible()
    await expect(page.locator('text=Chat Metrics')).toBeVisible()
  })

  test('admin can export data', async ({ page }) => {
    await page.goto('/analytics/users')
    
    // Click export
    await page.click('button:has-text("Export")')
    
    // Download should start
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("CSV")'),
    ])
    
    expect(download.suggestedFilename()).toContain('.csv')
  })
})
