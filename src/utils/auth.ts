import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface TokenPayload {
  userId: number
  username: string
}

interface JwtPayload {
  userId: number
  username: string
}

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    
    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        status: true
      }
    })

    if (!user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function generateToken(user: { id: number; username: string }) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function decodeToken(token: string) {
  try {
    return jwt.decode(token) as TokenPayload
  } catch (error) {
    console.error('Token decode error:', error)
    return null
  }
}

export async function verifyAuth(request?: Request) {
  try {
    // 从请求头获取 token
    const authHeader = request?.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return null
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    
    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
} 