import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AdminUser {
  isAdmin: boolean
  timestamp: number
}

export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser
    
    // Verifica che il token non sia troppo vecchio (24 ore)
    const now = Date.now()
    const tokenAge = now - decoded.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 ore in millisecondi
    
    if (tokenAge > maxAge) {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

export function getAdminTokenFromRequest(request: Request): string | null {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Fallback to cookie or other methods if needed
  return null
}

export function isAdminAuthenticated(request: Request): boolean {
  const token = getAdminTokenFromRequest(request)
  if (!token) return false
  
  const user = verifyAdminToken(token)
  return user !== null && user.isAdmin
}