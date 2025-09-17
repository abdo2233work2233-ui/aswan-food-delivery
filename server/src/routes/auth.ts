import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { generateToken, verifyRefreshToken } from '../utils/jwt';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import { ApiResponse, AuthResponse, RegisterRequest, LoginRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Register new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validate(registerSchema, req.body) as RegisterRequest;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          ...(validatedData.phone ? [{ phone: validatedData.phone }] : []),
        ],
      },
    });

    // ✅ FIX: Using if/else structure
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: existingUser.email === validatedData.email 
          ? 'Email address is already registered' 
          : 'Phone number is already registered',
        messageAr: existingUser.email === validatedData.email
          ? 'عنوان البريد الإلكتروني مسجل مسبقاً'
          : 'رقم الهاتف مسجل مسبقاً',
      };
      res.status(409).json(response);
    } else {
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          phone: validatedData.phone,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: validatedData.role,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
        },
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      const authResponse: AuthResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone ?? undefined,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar ?? undefined,
          isVerified: user.isVerified,
        },
      };

      const response: ApiResponse<AuthResponse> = {
        success: true,
        message: 'User registered successfully',
        messageAr: 'تم تسجيل المستخدم بنجاح',
        data: authResponse,
      };

      res.status(201).json(response);
    }
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validate(loginSchema, req.body) as LoginRequest;

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        phone: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        isVerified: true,
      },
    });

    // ✅ FIX: Using chained if/else if/else structure
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid email or password',
        messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };
      res.status(401).json(response);
    } else if (!user.isActive) {
      const response: ApiResponse = {
        success: false,
        message: 'Account is deactivated. Please contact support.',
        messageAr: 'الحساب معطل. يرجى الاتصال بالدعم الفني.',
      };
      res.status(401).json(response);
    } else {
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      
      if (!isPasswordValid) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid email or password',
          messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        };
        res.status(401).json(response);
      } else {
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        const authResponse: AuthResponse = {
          token,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone ?? undefined,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar ?? undefined,
            isVerified: user.isVerified,
          },
        };

        const response: ApiResponse<AuthResponse> = {
          success: true,
          message: 'Login successful',
          messageAr: 'تم تسجيل الدخول بنجاح',
          data: authResponse,
        };
        res.json(response);
      }
    }
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        addresses: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            governorate: true,
            latitude: true,
            longitude: true,
            isDefault: true,
          },
        },
      },
    });

    // ✅ FIX: Using if/else structure
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود',
      };
      res.status(404).json(response);
    } else {
      const response: ApiResponse = {
        success: true,
        message: 'User profile retrieved successfully',
        messageAr: 'تم استرداد ملف المستخدم بنجاح',
        data: user,
      };
      res.json(response);
    }
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const response: ApiResponse = {
        success: false,
        message: 'Refresh token is required',
        messageAr: 'رمز التحديث مطلوب',
      };
      res.status(400).json(response);
    } else {
      const { userId } = verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid refresh token',
          messageAr: 'رمز التحديث غير صالح',
        };
        res.status(401).json(response);
      } else {
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        const response: ApiResponse = {
          success: true,
          message: 'Token refreshed successfully',
          messageAr: 'تم تحديث الرمز بنجاح',
          data: { token },
        };
        res.json(response);
      }
    }
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = validate(forgotPasswordSchema, req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, firstName: true, lastName: true },
    });
    
    // TODO: Implement email sending logic here
    if (user) {
      console.log(`Password reset requested for user: ${user.firstName} ${user.lastName}`);
    }

    // Always return success for security reasons
    const response: ApiResponse = {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
      messageAr: 'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور.',
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    validate(resetPasswordSchema, req.body);

    // TODO: Verify reset token and update password
    const response: ApiResponse = {
      success: true,
      message: 'Password has been reset successfully',
      messageAr: 'تم إعادة تعيين كلمة المرور بنجاح',
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully',
      messageAr: 'تم تسجيل الخروج بنجاح',
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Verify email (placeholder)
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    // ✅ FIX: Using if/else structure
    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: 'Verification token is required',
        messageAr: 'رمز التحقق مطلوب',
      };
      res.status(400).json(response);
    } else {
      // TODO: Implement email verification logic
      const response: ApiResponse = {
        success: true,
        message: 'Email verified successfully',
        messageAr: 'تم التحقق من البريد الإلكتروني بنجاح',
      };
      res.json(response);
    }
  } catch (error) {
    next(error);
  }
});

export default router;