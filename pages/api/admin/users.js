import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // 管理者権限チェック
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  // ユーザー一覧取得
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          approvedAt: true,
          _count: {
            select: {
              uploadBatches: true,
              dicomInstances: true,
            },
          },
        },
      });

      res.status(200).json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // ユーザー承認/拒否/ロール変更
  else if (req.method === 'PATCH') {
    const { userId, action, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      // 承認
      if (action === 'approve') {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            role: 'user',
            approvedAt: new Date(),
            approvedBy: session.user.id,
          },
        });
        return res.status(200).json({
          success: true,
          message: 'User approved successfully',
          user: updatedUser,
        });
      }

      // 拒否（削除）
      else if (action === 'reject') {
        await prisma.user.delete({
          where: { id: userId },
        });
        return res.status(200).json({
          success: true,
          message: 'User rejected and deleted',
        });
      }

      // ロール変更
      else if (action === 'change_role' && role) {
        if (!['admin', 'user', 'pending'].includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { role },
        });
        return res.status(200).json({
          success: true,
          message: 'User role updated successfully',
          user: updatedUser,
        });
      }

      else {
        return res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // ユーザー削除
  else if (req.method === 'DELETE') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 自分自身は削除できない
    if (userId === session.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}



