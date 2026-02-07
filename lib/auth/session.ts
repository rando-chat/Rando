// Comprehensive session management with security features
import { createBrowserClient, createServerClient, createGuestClient } from '@/lib/database/client'
import { logError, logSecurityEvent, logInfo } from '@/lib/utils/logger'
import { contentModerator } from '@/lib/utils/safety'

// Session configuration
const SESSION_CONFIG = {
  // Timeouts (in milliseconds)
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  GUEST_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Security
  MAX_SESSIONS_PER_USER: 3,
  MAX_GUEST_SESSIONS_PER_IP: 5,
  SESSION_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  
  // Validation
  MIN_PASSWORD_LENGTH: 8,
  PASSWORD_COMPLEXITY: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Rate limiting
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  LOCKOUT_DURATION: 30 * 60 * 1000 // 30 minutes
} as const

export interface UserSession {
  id: string
  email?: string
  displayName: string
  tier: 'free' | 'student' | 'premium' | 'admin'
  isGuest: boolean
  avatarUrl?: string
  createdAt: Date
  lastActive: Date
  permissions: string[]
  metadata?: Record<string, any>
}

export interface SessionValidationResult {
  valid: boolean
  reason?: string
  user?: UserSession
  requiresAction?: 'refresh' | 'reauth' | 'upgrade'
}

export interface LoginAttempt {
  ip: string
  email: string
  timestamp: Date
  success: boolean
  userAgent?: string
}

class SessionManager {
  private loginAttempts: Map<string, LoginAttempt[]> = new Map()
  private activeSessions: Map<string, UserSession> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.startSessionCleanup()
  }

  // ==================== USER AUTHENTICATION ====================
  
  async signUp(email: string, password: string, displayName?: string) {
    try {
      // Validate input
      const validation = this.validateSignUpData(email, password, displayName)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
          requiresAction: validation.requiresAction
        }
      }

      // Check rate limiting
      const ip = await this.getClientIP()
      if (this.isRateLimited(ip, 'signup')) {
        return {
          success: false,
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: this.getRetryAfter(ip, 'signup')
        }
      }

      const client = createBrowserClient()
      
      // Check if email already exists
      const { data: existingUser } = await client
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists.'
        }
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || await this.generateDisplayName(),
            signup_ip: ip,
            signup_timestamp: new Date().toISOString()
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned from signup')

      // Create user profile in database
      const { error: profileError } = await client
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          display_name: displayName || authData.user.user_metadata.display_name,
          tier: 'free',
          created_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Log security event
      logSecurityEvent('UserSignUp', {
        userId: authData.user.id,
        email,
        ip,
        userAgent: navigator.userAgent
      })

      // Track session
      const userSession: UserSession = {
        id: authData.user.id,
        email: authData.user.email!,
        displayName: displayName || authData.user.user_metadata.display_name,
        tier: 'free',
        isGuest: false,
        createdAt: new Date(),
        lastActive: new Date(),
        permissions: ['chat:send', 'chat:receive', 'profile:view']
      }

      this.activeSessions.set(authData.user.id, userSession)

      return {
        success: true,
        user: userSession,
        requiresEmailVerification: !authData.session,
        message: authData.session ? 'Signup successful!' : 'Please check your email to verify your account.'
      }

    } catch (error) {
      logError('SignUp', 'Failed to sign up user', { email, error })
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    }
  }

  async signIn(email: string, password: string, rememberMe = false) {
    try {
      const ip = await this.getClientIP()
      const userAgent = navigator.userAgent

      // Check login attempts
      const loginCheck = this.checkLoginAttempts(email, ip)
      if (!loginCheck.allowed) {
        return {
          success: false,
          error: loginCheck.reason,
          retryAfter: loginCheck.retryAfter
        }
      }

      const client = createBrowserClient()
      
      // Check if user exists and isn't banned
      const { data: userProfile } = await client
        .from('users')
        .select('id, is_banned, ban_expires_at')
        .eq('email', email)
        .maybeSingle()

      if (userProfile?.is_banned) {
        const banExpiry = userProfile.ban_expires_at 
          ? new Date(userProfile.ban_expires_at)
          : null
        
        return {
          success: false,
          error: banExpiry && banExpiry > new Date()
            ? `Account suspended until ${banExpiry.toLocaleString()}`
            : 'Account permanently suspended'
        }
      }

      // Attempt login
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        this.recordLoginAttempt(email, ip, userAgent, false)
        
        // Don't reveal if user exists or not
        return {
          success: false,
          error: 'Invalid email or password.'
        }
      }

      if (!authData.user) {
        throw new Error('No user returned from login')
      }

      // Check if email is verified
      if (!authData.user.email_confirmed_at) {
        return {
          success: false,
          error: 'Please verify your email before logging in.',
          requiresAction: 'verify_email'
        }
      }

      // Update user's last login
      await client
        .from('users')
        .update({
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      // Get user profile
      const { data: profile } = await client
        .from('users')
        .select('display_name, tier, avatar_url')
        .eq('id', authData.user.id)
        .single()

      // Create session
      const userSession: UserSession = {
        id: authData.user.id,
        email: authData.user.email!,
        displayName: profile?.display_name || 'User',
        tier: profile?.tier || 'free',
        isGuest: false,
        avatarUrl: profile?.avatar_url,
        createdAt: new Date(authData.user.created_at),
        lastActive: new Date(),
        permissions: this.getUserPermissions(profile?.tier || 'free'),
        metadata: {
          emailVerified: !!authData.user.email_confirmed_at,
          provider: authData.user.app_metadata.provider
        }
      }

      // Store session
      this.activeSessions.set(authData.user.id, userSession)
      this.recordLoginAttempt(email, ip, userAgent, true)

      // Set session persistence
      if (rememberMe) {
        // Extend session duration
        await client.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        })
      }

      logSecurityEvent('UserSignIn', {
        userId: authData.user.id,
        email,
        ip,
        userAgent,
        rememberMe
      })

      return {
        success: true,
        user: userSession,
        session: authData.session
      }

    } catch (error) {
      logError('SignIn', 'Failed to sign in user', { email, error })
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      }
    }
  }

  async signOut(userId: string) {
    try {
      const client = createBrowserClient()
      
      // Clear active session
      this.activeSessions.delete(userId)
      
      // Sign out from Supabase
      const { error } = await client.auth.signOut()
      if (error) throw error

      logSecurityEvent('UserSignOut', { userId })
      
      return { success: true }
    } catch (error) {
      logError('SignOut', 'Failed to sign out user', { userId, error })
      return { success: false, error: 'Failed to sign out' }
    }
  }

  async createGuestSession() {
    try {
      const ip = await this.getClientIP()
      const userAgent = navigator.userAgent

      // Check rate limiting for guest sessions
      if (this.isRateLimited(ip, 'guest_session')) {
        return {
          success: false,
          error: 'Too many guest sessions created. Please try again later.'
        }
      }

      // Check if IP has too many active guest sessions
      const activeSessions = await this.getActiveGuestSessionsByIP(ip)
      if (activeSessions >= SESSION_CONFIG.MAX_GUEST_SESSIONS_PER_IP) {
        return {
          success: false,
          error: 'Maximum number of guest sessions reached for this IP.'
        }
      }

      const client = createBrowserClient()
      
      // Call database function to create guest session
      const { data: guestData, error: guestError } = await client
        .rpc('create_guest_session_v2', {
          p_ip_address: ip,
          p_user_agent: userAgent,
          p_country_code: await this.getCountryCode(ip)
        })

      if (guestError) throw guestError
      if (!guestData || guestData.length === 0) {
        throw new Error('No guest session data returned')
      }

      const guestSession = guestData[0]

      // Create user session object
      const userSession: UserSession = {
        id: guestSession.guest_id,
        displayName: guestSession.display_name,
        tier: 'free',
        isGuest: true,
        createdAt: new Date(),
        lastActive: new Date(),
        permissions: ['chat:send', 'chat:receive'],
        metadata: {
          sessionToken: guestSession.session_token,
          expiresAt: new Date(guestSession.expires_at),
          ip,
          userAgent
        }
      }

      // Store session token in secure storage (httpOnly cookie would be better)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('guest_session_token', guestSession.session_token)
      }

      this.activeSessions.set(guestSession.guest_id, userSession)

      logSecurityEvent('GuestSessionCreated', {
        guestId: guestSession.guest_id,
        ip,
        userAgent
      })

      return {
        success: true,
        session: userSession,
        sessionToken: guestSession.session_token,
        expiresAt: new Date(guestSession.expires_at)
      }

    } catch (error) {
      logError('GuestSession', 'Failed to create guest session', { error })
      return {
        success: false,
        error: 'Failed to create guest session. Please try again.'
      }
    }
  }

  // ==================== SESSION VALIDATION ====================
  
  async validateSession(sessionId: string, isGuest: boolean): Promise<SessionValidationResult> {
    try {
      // Check active sessions cache first
      const cachedSession = this.activeSessions.get(sessionId)
      if (cachedSession && this.isSessionActive(cachedSession)) {
        cachedSession.lastActive = new Date()
        return { valid: true, user: cachedSession }
      }

      let userSession: UserSession | null = null

      if (isGuest) {
        // Validate guest session
        const result = await this.validateGuestSession(sessionId)
        if (!result.valid) return result
        userSession = result.user!
      } else {
        // Validate user session
        const result = await this.validateUserSession(sessionId)
        if (!result.valid) return result
        userSession = result.user!
      }

      // Check if user is banned
      const eligibility = await contentModerator.checkUserEligibility(sessionId, isGuest)
      if (!eligibility.eligible) {
        return {
          valid: false,
          reason: eligibility.reason,
          requiresAction: 'reauth'
        }
      }

      // Update cache
      this.activeSessions.set(sessionId, userSession)

      return { valid: true, user: userSession }

    } catch (error) {
      logError('SessionValidation', 'Failed to validate session', { sessionId, isGuest, error })
      return {
        valid: false,
        reason: 'Session validation failed'
      }
    }
  }

  private async validateGuestSession(guestId: string): Promise<SessionValidationResult> {
    try {
      const client = createBrowserClient()
      
      // Get session token from storage
      let sessionToken: string | null = null
      if (typeof window !== 'undefined') {
        sessionToken = sessionStorage.getItem('guest_session_token')
      }

      if (!sessionToken) {
        return { valid: false, reason: 'No session token found' }
      }

      // Create guest client to validate
      const { client: guestClient, sessionId } = await createGuestClient(sessionToken)
      
      if (sessionId !== guestId) {
        return { valid: false, reason: 'Session token mismatch' }
      }

      // Get guest session details
      const { data: guestSession, error } = await guestClient
        .from('guest_sessions')
        .select('display_name, expires_at, is_banned, report_count')
        .eq('id', guestId)
        .single()

      if (error) throw error
      if (!guestSession) return { valid: false, reason: 'Guest session not found' }

      if (guestSession.is_banned) {
        return { valid: false, reason: 'Guest session is banned' }
      }

      if (new Date(guestSession.expires_at) < new Date()) {
        return { valid: false, reason: 'Guest session expired' }
      }

      if (guestSession.report_count >= 3) {
        return { valid: false, reason: 'Too many reports' }
      }

      const userSession: UserSession = {
        id: guestId,
        displayName: guestSession.display_name,
        tier: 'free',
        isGuest: true,
        createdAt: new Date(),
        lastActive: new Date(),
        permissions: ['chat:send', 'chat:receive'],
        metadata: {
          sessionToken,
          expiresAt: new Date(guestSession.expires_at)
        }
      }

      return { valid: true, user: userSession }

    } catch (error) {
      logError('GuestValidation', 'Failed to validate guest session', { guestId, error })
      return { valid: false, reason: 'Guest session validation failed' }
    }
  }

  private async validateUserSession(userId: string): Promise<SessionValidationResult> {
    try {
      const client = createBrowserClient()
      
      // Get current session
      const { data: { session }, error: sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) return { valid: false, reason: 'No active session' }

      // Verify session belongs to this user
      if (session.user.id !== userId) {
        return { valid: false, reason: 'Session user mismatch' }
      }

      // Check if session is expired
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        return { 
          valid: false, 
          reason: 'Session expired',
          requiresAction: 'refresh' 
        }
      }

      // Get user profile
      const { data: profile, error: profileError } = await client
        .from('users')
        .select('display_name, tier, avatar_url, is_banned, ban_expires_at, email_verified')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      if (!profile) return { valid: false, reason: 'User profile not found' }

      if (profile.is_banned) {
        const banExpiry = profile.ban_expires_at 
          ? new Date(profile.ban_expires_at)
          : null
        
        return {
          valid: false,
          reason: banExpiry && banExpiry > new Date()
            ? `Account suspended until ${banExpiry.toLocaleString()}`
            : 'Account permanently suspended'
        }
      }

      // Check if email verification is required but not completed
      if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !profile.email_verified) {
        return {
          valid: false,
          reason: 'Email verification required',
          requiresAction: 'verify_email'
        }
      }

      const userSession: UserSession = {
        id: userId,
        email: session.user.email!,
        displayName: profile.display_name,
        tier: profile.tier,
        isGuest: false,
        avatarUrl: profile.avatar_url,
        createdAt: new Date(session.user.created_at),
        lastActive: new Date(),
        permissions: this.getUserPermissions(profile.tier),
        metadata: {
          emailVerified: profile.email_verified,
          lastSignIn: session.user.last_sign_in_at
        }
      }

      return { valid: true, user: userSession }

    } catch (error) {
      logError('UserValidation', 'Failed to validate user session', { userId, error })
      return { valid: false, reason: 'User session validation failed' }
    }
  }

  // ==================== SECURITY FEATURES ====================
  
  private checkLoginAttempts(email: string, ip: string): {
    allowed: boolean
    reason?: string
    retryAfter?: number
  } {
    const now = Date.now()
    const windowStart = now - SESSION_CONFIG.LOGIN_WINDOW
    
    // Get attempts for this email
    const emailAttempts = this.loginAttempts.get(email) || []
    const recentEmailAttempts = emailAttempts.filter(a => 
      new Date(a.timestamp).getTime() > windowStart && !a.success
    )
    
    // Get attempts for this IP
    const ipAttempts = Array.from(this.loginAttempts.values())
      .flat()
      .filter(a => a.ip === ip && new Date(a.timestamp).getTime() > windowStart && !a.success)
    
    // Check email-based lockout
    if (recentEmailAttempts.length >= SESSION_CONFIG.LOGIN_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentEmailAttempts.map(a => new Date(a.timestamp).getTime()))
      const lockoutEnds = oldestAttempt + SESSION_CONFIG.LOCKOUT_DURATION
      
      if (now < lockoutEnds) {
        return {
          allowed: false,
          reason: 'Too many failed login attempts. Account temporarily locked.',
          retryAfter: Math.ceil((lockoutEnds - now) / 1000)
        }
      }
    }
    
    // Check IP-based lockout (more lenient)
    if (ipAttempts.length >= SESSION_CONFIG.LOGIN_ATTEMPTS * 3) {
      return {
        allowed: false,
        reason: 'Too many login attempts from this IP. Please try again later.',
        retryAfter: 300 // 5 minutes
      }
    }
    
    return { allowed: true }
  }
  
  private recordLoginAttempt(email: string, ip: string, userAgent: string | undefined, success: boolean) {
    const attempt: LoginAttempt = {
      email,
      ip,
      timestamp: new Date(),
      success,
      userAgent
    }
    
    const attempts = this.loginAttempts.get(email) || []
    attempts.push(attempt)
    
    // Keep only recent attempts
    const windowStart = Date.now() - (SESSION_CONFIG.LOGIN_WINDOW * 2)
    const filteredAttempts = attempts.filter(a => 
      new Date(a.timestamp).getTime() > windowStart
    )
    
    this.loginAttempts.set(email, filteredAttempts)
    
    // Log security event for failed attempts
    if (!success) {
      logSecurityEvent('FailedLoginAttempt', {
        email,
        ip,
        userAgent,
        timestamp: attempt.timestamp.toISOString()
      })
    }
  }
  
  private isRateLimited(identifier: string, action: string): boolean {
    const key = `${action}:${identifier}`
    const now = Date.now()
    
    // This is a simplified rate limiter - in production, use Redis
    const attempts = this.loginAttempts.get(key) || []
    const recentAttempts = attempts.filter(a => 
      new Date(a.timestamp).getTime() > now - SESSION_CONFIG.LOGIN_WINDOW
    )
    
    const maxAttempts = {
      signup: 3,
      guest_session: 5,
      password_reset: 3
    }[action] || 5
    
    return recentAttempts.length >= maxAttempts
  }
  
  private getRetryAfter(identifier: string, action: string): number {
    const key = `${action}:${identifier}`
    const attempts = this.loginAttempts.get(key) || []
    
    if (attempts.length === 0) return 0
    
    const oldestAttempt = Math.min(...attempts.map(a => new Date(a.timestamp).getTime()))
    const retryTime = oldestAttempt + SESSION_CONFIG.LOGIN_WINDOW
    const now = Date.now()
    
    return Math.max(0, Math.ceil((retryTime - now) / 1000))
  }
  
  // ==================== UTILITY FUNCTIONS ====================
  
  private validateSignUpData(email: string, password: string, displayName?: string): {
    valid: boolean
    reason?: string
    requiresAction?: string
  } {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Please enter a valid email address' }
    }
    
    // Password validation
    if (password.length < SESSION_CONFIG.MIN_PASSWORD_LENGTH) {
      return { 
        valid: false, 
        reason: `Password must be at least ${SESSION_CONFIG.MIN_PASSWORD_LENGTH} characters long` 
      }
    }
    
    if (!SESSION_CONFIG.PASSWORD_COMPLEXITY.test(password)) {
      return {
        valid: false,
        reason: 'Password must contain uppercase, lowercase, number, and special character'
      }
    }
    
    // Display name validation (if provided)
    if (displayName) {
      if (displayName.length < 2) {
        return { valid: false, reason: 'Display name must be at least 2 characters' }
      }
      
      if (displayName.length > 32) {
        return { valid: false, reason: 'Display name must be 32 characters or less' }
      }
      
      // Check for invalid characters
      const invalidChars = displayName.match(/[<>{}[\]\\|]/)
      if (invalidChars) {
        return { valid: false, reason: 'Display name contains invalid characters' }
      }
    }
    
    return { valid: true }
  }
  
  private async generateDisplayName(): Promise<string> {
    try {
      const client = createBrowserClient()
      const { data: name } = await client
        .rpc('generate_display_name_v2', { p_gender_preference: 'neutral' })
      
      return name || `User${Math.floor(Math.random() * 10000)}`
    } catch (error) {
      logError('DisplayName', 'Failed to generate display name', error)
      return `User${Math.floor(Math.random() * 10000)}`
    }
  }
  
  private getUserPermissions(tier: string): string[] {
    const basePermissions = ['chat:send', 'chat:receive', 'profile:view']
    
    switch (tier) {
      case 'premium':
        return [...basePermissions, 'chat:image', 'chat:priority', 'profile:customize']
      case 'student':
        return [...basePermissions, 'chat:image', 'profile:customize']
      case 'admin':
        return [...basePermissions, 'admin:view', 'admin:moderate', 'admin:manage']
      default: // free
        return basePermissions
    }
  }
  
  private isSessionActive(session: UserSession): boolean {
    const now = new Date()
    const lastActive = new Date(session.lastActive)
    const age = now.getTime() - lastActive.getTime()
    
    return age < SESSION_CONFIG.SESSION_TIMEOUT
  }
  
  private async getClientIP(): Promise<string> {
    // In a real application, this would get the IP from request headers
    // For client-side, we can use a service or leave empty
    return 'unknown'
  }
  
  private async getCountryCode(ip: string): Promise<string | null> {
    // In production, use a geolocation service
    return null
  }
  
  private async getActiveGuestSessionsByIP(ip: string): Promise<number> {
    try {
      const client = createBrowserClient()
      const { count } = await client
        .from('guest_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gt('expires_at', new Date().toISOString())
        .eq('is_banned', false)
      
      return count || 0
    } catch (error) {
      logError('GuestSessionCount', 'Failed to count guest sessions', { ip, error })
      return 0
    }
  }
  
  // ==================== SESSION CLEANUP ====================
  
  private startSessionCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, SESSION_CONFIG.SESSION_CLEANUP_INTERVAL)
  }
  
  private cleanupExpiredSessions() {
    const now = new Date()
    
    // Clean up active sessions cache
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (!this.isSessionActive(session)) {
        this.activeSessions.delete(sessionId)
      }
    }
    
    // Clean up old login attempts
    const windowStart = Date.now() - (SESSION_CONFIG.LOGIN_WINDOW * 2)
    for (const [email, attempts] of this.loginAttempts.entries()) {
      const filteredAttempts = attempts.filter(a => 
        new Date(a.timestamp).getTime() > windowStart
      )
      
      if (filteredAttempts.length === 0) {
        this.loginAttempts.delete(email)
      } else {
        this.loginAttempts.set(email, filteredAttempts)
      }
    }
    
    logInfo('SessionCleanup', 'Cleaned up expired sessions and login attempts')
  }
  
  // ==================== PUBLIC API ====================
  
  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const client = createBrowserClient()
      const { data: { user } } = await client.auth.getUser()
      
      if (!user) {
        // Check for guest session
        if (typeof window !== 'undefined') {
          const guestToken = sessionStorage.getItem('guest_session_token')
          if (guestToken) {
            // Validate guest session
            // This is simplified - in production, you'd validate the token
            const guestSession = Array.from(this.activeSessions.values())
              .find(s => s.isGuest && s.metadata?.sessionToken === guestToken)
            
            if (guestSession && this.isSessionActive(guestSession)) {
              return guestSession
            }
          }
        }
        return null
      }
      
      const session = this.activeSessions.get(user.id)
      if (session && this.isSessionActive(session)) {
        return session
      }
      
      // Revalidate session
      const validation = await this.validateSession(user.id, false)
      return validation.valid ? validation.user! : null
      
    } catch (error) {
      logError('GetCurrentSession', 'Failed to get current session', error)
      return null
    }
  }
  
  async refreshSession(userId: string, isGuest: boolean): Promise<SessionValidationResult> {
    try {
      if (isGuest) {
        // Guest sessions can't be refreshed - create new one
        return {
          valid: false,
          reason: 'Guest session expired. Please start a new chat.',
          requiresAction: 'reauth'
        }
      }
      
      const client = createBrowserClient()
      const { data: { session }, error } = await client.auth.refreshSession()
      
      if (error) throw error
      if (!session) return { valid: false, reason: 'Failed to refresh session' }
      
      // Update active session
      const cachedSession = this.activeSessions.get(userId)
      if (cachedSession) {
        cachedSession.lastActive = new Date()
        this.activeSessions.set(userId, cachedSession)
      }
      
      return { valid: true }
      
    } catch (error) {
      logError('RefreshSession', 'Failed to refresh session', { userId, isGuest, error })
      return { valid: false, reason: 'Failed to refresh session' }
    }
  }
  
  async updateUserProfile(
    userId: string, 
    updates: { displayName?: string; avatarUrl?: string; bio?: string }
  ) {
    try {
      const validation = await this.validateSession(userId, false)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason || 'Session invalid'
        }
      }
      
      // Validate display name if changing
      if (updates.displayName) {
        const nameCheck = await contentModerator.validateDisplayName(updates.displayName)
        if (!nameCheck.valid) {
          return {
            success: false,
            error: nameCheck.reason,
            suggestedName: nameCheck.suggestedName
          }
        }
      }
      
      const client = createBrowserClient()
      
      const { error } = await client
        .from('users')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
          bio: updates.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (error) throw error
      
      // Update cached session
      const cachedSession = this.activeSessions.get(userId)
      if (cachedSession) {
        if (updates.displayName) cachedSession.displayName = updates.displayName
        if (updates.avatarUrl) cachedSession.avatarUrl = updates.avatarUrl
        this.activeSessions.set(userId, cachedSession)
      }
      
      logSecurityEvent('ProfileUpdated', {
        userId,
        updates,
        timestamp: new Date().toISOString()
      })
      
      return { success: true }
      
    } catch (error) {
      logError('UpdateProfile', 'Failed to update user profile', { userId, updates, error })
      return {
        success: false,
        error: 'Failed to update profile'
      }
    }
  }
  
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.activeSessions.clear()
    this.loginAttempts.clear()
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()

// Export utility functions
export async function getCurrentUser(): Promise<UserSession | null> {
  return sessionManager.getCurrentSession()
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin(): Promise<UserSession> {
  const user = await requireAuth()
  if (user.tier !== 'admin') {
    throw new Error('Administrator privileges required')
  }
  return user
}

export default {
  sessionManager,
  getCurrentUser,
  requireAuth,
  requireAdmin
}