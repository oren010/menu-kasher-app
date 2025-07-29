const express = require('express');
const { PrismaClient } = require('@prisma/client');
const NotificationService = require('../services/NotificationService');
const { 
  requireAuth, 
  requireAdmin, 
  requirePermission,
  auditLogger,
  adminActionRateLimiter
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const notificationService = new NotificationService(prisma);

// ========================================
// ROUTES POUR UTILISATEURS
// ========================================

/**
 * GET /api/notifications/me
 * Obtenir ses propres notifications
 */
router.get('/me', 
  requireAuth,
  async (req, res) => {
    try {
      const {
        includeRead = 'true',
        category,
        type,
        limit = '50',
        offset = '0'
      } = req.query;

      const options = {
        includeRead: includeRead === 'true',
        category,
        type,
        limit: Math.min(parseInt(limit) || 50, 100), // Max 100
        offset: parseInt(offset) || 0
      };

      const result = await notificationService.getUserNotifications(req.user.id, options);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }
  }
);

/**
 * GET /api/notifications/me/stats
 * Obtenir les statistiques de ses notifications
 */
router.get('/me/stats',
  requireAuth,
  async (req, res) => {
    try {
      const stats = await notificationService.getNotificationStats(req.user.id);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * Marquer une notification comme lue
 */
router.put('/:id/read',
  requireAuth,
  auditLogger('USER_READ_NOTIFICATION', 'notifications'),
  async (req, res) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Notification marquée comme lue',
        notification
      });

    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      res.status(error.message.includes('non trouvée') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors du marquage comme lu'
      });
    }
  }
);

/**
 * PUT /api/notifications/me/read-all
 * Marquer toutes ses notifications comme lues
 */
router.put('/me/read-all',
  requireAuth,
  auditLogger('USER_READ_ALL_NOTIFICATIONS', 'notifications'),
  async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);

      res.json({
        success: true,
        message: `${result.count} notifications marquées comme lues`
      });

    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage global comme lu'
      });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Supprimer une de ses notifications
 */
router.delete('/:id',
  requireAuth,
  auditLogger('USER_DELETE_NOTIFICATION', 'notifications'),
  async (req, res) => {
    try {
      const result = await notificationService.deleteNotification(req.params.id, req.user.id);

      res.json({
        success: true,
        message: 'Notification supprimée'
      });

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      res.status(error.message.includes('non trouvée') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression'
      });
    }
  }
);

// ========================================
// ROUTES POUR ADMINISTRATEURS
// ========================================

/**
 * GET /api/notifications/admin/me
 * Obtenir ses propres notifications admin
 */
router.get('/admin/me',
  requireAdmin,
  async (req, res) => {
    try {
      const {
        includeRead = 'true',
        category,
        type,
        limit = '50',
        offset = '0'
      } = req.query;

      const options = {
        includeRead: includeRead === 'true',
        category,
        type,
        limit: Math.min(parseInt(limit) || 50, 100),
        offset: parseInt(offset) || 0
      };

      const result = await notificationService.getAdminNotifications(req.admin.id, options);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }
  }
);

/**
 * GET /api/notifications/admin/me/stats
 * Obtenir les statistiques de ses notifications admin
 */
router.get('/admin/me/stats',
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await notificationService.getNotificationStats(null, req.admin.id);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * PUT /api/notifications/admin/:id/read
 * Marquer une notification admin comme lue
 */
router.put('/admin/:id/read',
  requireAdmin,
  async (req, res) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id, null, req.admin.id);

      res.json({
        success: true,
        message: 'Notification marquée comme lue',
        notification
      });

    } catch (error) {
      console.error('Erreur lors du marquage admin comme lu:', error);
      res.status(error.message.includes('non trouvée') ? 404 : 500).json({
        success: false,
        message: error.message || 'Erreur lors du marquage comme lu'
      });
    }
  }
);

/**
 * PUT /api/notifications/admin/me/read-all
 * Marquer toutes ses notifications admin comme lues
 */
router.put('/admin/me/read-all',
  requireAdmin,
  async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(null, req.admin.id);

      res.json({
        success: true,
        message: `${result.count} notifications marquées comme lues`
      });

    } catch (error) {
      console.error('Erreur lors du marquage global admin:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage global comme lu'
      });
    }
  }
);

// ========================================
// ROUTES DE GESTION (ADMIN SEULEMENT)
// ========================================

/**
 * POST /api/notifications/create
 * Créer une nouvelle notification (admin seulement)
 */
router.post('/create',
  adminActionRateLimiter,
  ...requirePermission('notifications.create'),
  auditLogger('ADMIN_CREATE_NOTIFICATION', 'notifications'),
  async (req, res) => {
    try {
      const {
        title,
        message,
        type = 'info',
        category = 'general',
        userId,
        adminId,
        data,
        url,
        expiresAt
      } = req.body;

      // Validation
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Le titre et le message sont requis'
        });
      }

      if (!userId && !adminId) {
        return res.status(400).json({
          success: false,
          message: 'Un destinataire (userId ou adminId) est requis'
        });
      }

      const notification = await notificationService.createNotification({
        title,
        message,
        type,
        category,
        userId,
        adminId,
        data,
        url,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      res.status(201).json({
        success: true,
        message: 'Notification créée avec succès',
        notification
      });

    } catch (error) {
      console.error('Erreur lors de la création de notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la création de la notification'
      });
    }
  }
);

/**
 * POST /api/notifications/broadcast
 * Envoyer une notification à tous les utilisateurs ou admins
 */
router.post('/broadcast',
  adminActionRateLimiter,
  ...requirePermission('notifications.create'),
  auditLogger('ADMIN_BROADCAST_NOTIFICATION', 'notifications'),
  async (req, res) => {
    try {
      const {
        title,
        message,
        type = 'info',
        category = 'general',
        target = 'users', // 'users', 'admins', 'all'
        data,
        url,
        expiresAt
      } = req.body;

      // Validation
      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Le titre et le message sont requis'
        });
      }

      if (!['users', 'admins', 'all'].includes(target)) {
        return res.status(400).json({
          success: false,
          message: 'Target doit être "users", "admins" ou "all"'
        });
      }

      const notifications = [];

      // Notification pour les utilisateurs
      if (target === 'users' || target === 'all') {
        const activeUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        });

        const userNotifications = await Promise.all(
          activeUsers.map(user => 
            notificationService.createNotification({
              title,
              message,
              type,
              category,
              userId: user.id,
              data,
              url,
              expiresAt: expiresAt ? new Date(expiresAt) : null
            })
          )
        );

        notifications.push(...userNotifications);
      }

      // Notification pour les admins
      if (target === 'admins' || target === 'all') {
        const activeAdmins = await prisma.admin.findMany({
          where: { isActive: true },
          select: { id: true }
        });

        const adminNotifications = await Promise.all(
          activeAdmins.map(admin => 
            notificationService.createNotification({
              title,
              message,
              type,
              category,
              adminId: admin.id,
              data,
              url,
              expiresAt: expiresAt ? new Date(expiresAt) : null
            })
          )
        );

        notifications.push(...adminNotifications);
      }

      res.status(201).json({
        success: true,
        message: `${notifications.length} notifications diffusées`,
        count: notifications.length
      });

    } catch (error) {
      console.error('Erreur lors de la diffusion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la diffusion des notifications'
      });
    }
  }
);

/**
 * GET /api/notifications/all
 * Obtenir toutes les notifications (admin seulement)
 */
router.get('/all',
  ...requirePermission('notifications.read'),
  async (req, res) => {
    try {
      const {
        target, // 'users', 'admins', 'all'
        category,
        type,
        includeRead = 'true',
        limit = '50',
        offset = '0',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const where = {};

      // Filtrer par destinataire
      if (target === 'users') {
        where.userId = { not: null };
      } else if (target === 'admins') {
        where.adminId = { not: null };
      }

      // Filtrer par catégorie et type
      if (category) where.category = category;
      if (type) where.type = type;

      // Filtrer par statut de lecture
      if (includeRead === 'false') {
        where.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: Math.min(parseInt(limit) || 50, 100),
          skip: parseInt(offset) || 0,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            admin: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.notification.count({ where })
      ]);

      res.json({
        success: true,
        notifications,
        pagination: {
          total,
          limit: Math.min(parseInt(limit) || 50, 100),
          offset: parseInt(offset) || 0,
          hasMore: total > parseInt(offset) + Math.min(parseInt(limit) || 50, 100)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }
  }
);

/**
 * GET /api/notifications/stats
 * Obtenir les statistiques globales de notifications (admin seulement)
 */
router.get('/stats',
  ...requirePermission('notifications.read'),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalAdmins,
        unreadUsers,
        unreadAdmins,
        recentUsers,
        recentAdmins,
        byType,
        byCategory
      ] = await Promise.all([
        // Total notifications utilisateurs
        prisma.notification.count({ where: { userId: { not: null } } }),
        
        // Total notifications admins
        prisma.notification.count({ where: { adminId: { not: null } } }),
        
        // Non lues utilisateurs
        prisma.notification.count({ 
          where: { userId: { not: null }, isRead: false } 
        }),
        
        // Non lues admins
        prisma.notification.count({ 
          where: { adminId: { not: null }, isRead: false } 
        }),
        
        // Récentes utilisateurs (24h)
        prisma.notification.count({
          where: {
            userId: { not: null },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        
        // Récentes admins (24h)
        prisma.notification.count({
          where: {
            adminId: { not: null },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),

        // Par type
        prisma.notification.groupBy({
          by: ['type'],
          _count: { id: true }
        }),

        // Par catégorie
        prisma.notification.groupBy({
          by: ['category'],
          _count: { id: true }
        })
      ]);

      res.json({
        success: true,
        stats: {
          users: {
            total: totalUsers,
            unread: unreadUsers,
            recent: recentUsers
          },
          admins: {
            total: totalAdmins,
            unread: unreadAdmins,
            recent: recentAdmins
          },
          global: {
            total: totalUsers + totalAdmins,
            unread: unreadUsers + unreadAdmins,
            recent: recentUsers + recentAdmins
          },
          byType: byType.reduce((acc, item) => {
            acc[item.type] = item._count.id;
            return acc;
          }, {}),
          byCategory: byCategory.reduce((acc, item) => {
            acc[item.category] = item._count.id;
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques globales:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * DELETE /api/notifications/cleanup
 * Nettoyer les notifications expirées (admin seulement)
 */
router.delete('/cleanup',
  adminActionRateLimiter,
  ...requirePermission('notifications.delete'),
  auditLogger('ADMIN_CLEANUP_NOTIFICATIONS', 'notifications'),
  async (req, res) => {
    try {
      const result = await notificationService.cleanupExpiredNotifications();

      res.json({
        success: true,
        message: `${result.count} notifications expirées supprimées`,
        count: result.count
      });

    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des notifications'
      });
    }
  }
);

// Gestion des erreurs
router.use((error, req, res, next) => {
  console.error('Erreur dans les routes notifications:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

module.exports = router;