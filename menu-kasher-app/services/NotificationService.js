const { PrismaClient } = require('@prisma/client');

class NotificationService {
  constructor(prismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Créer une notification
   * @param {Object} data - Données de la notification
   * @param {string} data.title - Titre de la notification
   * @param {string} data.message - Message de la notification
   * @param {string} [data.type='info'] - Type (info, success, warning, danger)
   * @param {string} [data.category='general'] - Catégorie
   * @param {string} [data.userId] - ID utilisateur destinataire
   * @param {string} [data.adminId] - ID admin destinataire
   * @param {Object} [data.data] - Données additionnelles
   * @param {string} [data.url] - URL de redirection
   * @param {Date} [data.expiresAt] - Date d'expiration
   */
  async createNotification(data) {
    try {
      const {
        title,
        message,
        type = 'info',
        category = 'general',
        userId,
        adminId,
        data: additionalData,
        url,
        expiresAt
      } = data;

      // Validation : soit userId soit adminId doit être fourni
      if (!userId && !adminId) {
        throw new Error('Une notification doit avoir un destinataire (userId ou adminId)');
      }

      if (userId && adminId) {
        throw new Error('Une notification ne peut pas avoir à la fois un userId et un adminId');
      }

      const notification = await this.prisma.notification.create({
        data: {
          title,
          message,
          type,
          category,
          userId: userId || null,
          adminId: adminId || null,
          data: additionalData || null,
          url: url || null,
          expiresAt: expiresAt || null
        },
        include: {
          user: userId ? {
            select: { id: true, name: true, email: true }
          } : false,
          admin: adminId ? {
            select: { id: true, name: true, email: true }
          } : false
        }
      });

      console.log(`📧 Notification créée: "${title}" pour ${userId ? 'user' : 'admin'} ${userId || adminId}`);
      return notification;

    } catch (error) {
      console.error('Erreur lors de la création de notification:', error);
      throw error;
    }
  }

  /**
   * Créer des notifications en masse
   * @param {Array} notifications - Array de données de notifications
   */
  async createBulkNotifications(notifications) {
    try {
      const results = await Promise.all(
        notifications.map(notif => this.createNotification(notif))
      );
      
      console.log(`📧 ${results.length} notifications créées en masse`);
      return results;

    } catch (error) {
      console.error('Erreur lors de la création en masse:', error);
      throw error;
    }
  }

  /**
   * Obtenir les notifications d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        includeRead = true,
        category,
        type,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const where = {
        userId,
        AND: []
      };

      // Filtrer par statut de lecture
      if (!includeRead) {
        where.AND.push({ isRead: false });
      }

      // Filtrer par catégorie
      if (category) {
        where.AND.push({ category });
      }

      // Filtrer par type
      if (type) {
        where.AND.push({ type });
      }

      // Exclure les notifications expirées
      where.AND.push({
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      });

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        this.prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit
        }
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications utilisateur:', error);
      throw error;
    }
  }

  /**
   * Obtenir les notifications d'un admin
   * @param {string} adminId - ID de l'admin
   * @param {Object} options - Options de filtrage
   */
  async getAdminNotifications(adminId, options = {}) {
    try {
      const {
        includeRead = true,
        category,
        type,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const where = {
        adminId,
        AND: []
      };

      // Filtrer par statut de lecture
      if (!includeRead) {
        where.AND.push({ isRead: false });
      }

      // Filtrer par catégorie
      if (category) {
        where.AND.push({ category });
      }

      // Filtrer par type
      if (type) {
        where.AND.push({ type });
      }

      // Exclure les notifications expirées
      where.AND.push({
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      });

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
          include: {
            admin: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        this.prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: total > offset + limit
        }
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des notifications admin:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur (pour vérification)
   * @param {string} adminId - ID de l'admin (pour vérification)
   */
  async markAsRead(notificationId, userId = null, adminId = null) {
    try {
      // Vérifier que la notification appartient bien à l'utilisateur/admin
      const where = { id: notificationId };
      if (userId) where.userId = userId;
      if (adminId) where.adminId = adminId;

      const notification = await this.prisma.notification.findFirst({ where });
      
      if (!notification) {
        throw new Error('Notification non trouvée ou non autorisée');
      }

      if (notification.isRead) {
        return notification; // Déjà lue
      }

      const updatedNotification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        },
        include: {
          user: userId ? {
            select: { id: true, name: true, email: true }
          } : false,
          admin: adminId ? {
            select: { id: true, name: true, email: true }
          } : false
        }
      });

      return updatedNotification;

    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   * @param {string} userId - ID de l'utilisateur
   * @param {string} adminId - ID de l'admin
   */
  async markAllAsRead(userId = null, adminId = null) {
    try {
      const where = {};
      if (userId) where.userId = userId;
      if (adminId) where.adminId = adminId;

      const result = await this.prisma.notification.updateMany({
        where: {
          ...where,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      console.log(`📧 ${result.count} notifications marquées comme lues`);
      return result;

    } catch (error) {
      console.error('Erreur lors du marquage global comme lu:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   * @param {string} notificationId - ID de la notification
   * @param {string} userId - ID de l'utilisateur (pour vérification)
   * @param {string} adminId - ID de l'admin (pour vérification)
   */
  async deleteNotification(notificationId, userId = null, adminId = null) {
    try {
      // Vérifier que la notification appartient bien à l'utilisateur/admin
      const where = { id: notificationId };
      if (userId) where.userId = userId;
      if (adminId) where.adminId = adminId;

      const notification = await this.prisma.notification.findFirst({ where });
      
      if (!notification) {
        throw new Error('Notification non trouvée ou non autorisée');
      }

      await this.prisma.notification.delete({
        where: { id: notificationId }
      });

      return { success: true, message: 'Notification supprimée' };

    } catch (error) {
      console.error('Erreur lors de la suppression de notification:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les notifications expirées
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`🧹 ${result.count} notifications expirées supprimées`);
      return result;

    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de notifications
   * @param {string} userId - ID utilisateur (optionnel)
   * @param {string} adminId - ID admin (optionnel)
   */
  async getNotificationStats(userId = null, adminId = null) {
    try {
      const where = {};
      if (userId) where.userId = userId;
      if (adminId) where.adminId = adminId;

      const [
        total,
        unread,
        byType,
        byCategory,
        recent
      ] = await Promise.all([
        // Total
        this.prisma.notification.count({ where }),
        
        // Non lues
        this.prisma.notification.count({
          where: { ...where, isRead: false }
        }),

        // Par type
        this.prisma.notification.groupBy({
          by: ['type'],
          where,
          _count: { id: true }
        }),

        // Par catégorie
        this.prisma.notification.groupBy({
          by: ['category'],
          where,
          _count: { id: true }
        }),

        // Récentes (dernières 24h)
        this.prisma.notification.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        total,
        unread,
        read: total - unread,
        recent,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count.id;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // =====================================
  // MÉTHODES UTILITAIRES DE CRÉATION
  // =====================================

  /**
   * Notification de bienvenue pour nouvel utilisateur
   */
  async createWelcomeNotification(userId) {
    return this.createNotification({
      userId,
      title: '🎉 Bienvenue sur Menu Kasher !',
      message: 'Votre compte a été créé avec succès. Découvrez toutes nos fonctionnalités pour créer des menus personnalisés.',
      type: 'success',
      category: 'user',
      url: '/dashboard'
    });
  }

  /**
   * Notification de menu généré
   */
  async createMenuGeneratedNotification(userId, menuName) {
    return this.createNotification({
      userId,
      title: '📅 Nouveau menu généré',
      message: `Votre menu "${menuName}" a été généré avec succès. Consultez-le dès maintenant !`,
      type: 'success',
      category: 'menu',
      url: '/menus'
    });
  }

  /**
   * Notification d'action admin sur compte utilisateur
   */
  async createUserAccountActionNotification(userId, action, adminName) {
    const messages = {
      'activated': 'Votre compte a été activé par un administrateur.',
      'deactivated': 'Votre compte a été temporairement désactivé.',
      'unlocked': 'Votre compte a été déverrouillé.',
      'password_reset': 'Votre mot de passe a été réinitialisé par un administrateur.'
    };

    const types = {
      'activated': 'success',
      'deactivated': 'warning',
      'unlocked': 'success',
      'password_reset': 'warning'
    };

    return this.createNotification({
      userId,
      title: '👤 Action sur votre compte',
      message: messages[action] || 'Une action a été effectuée sur votre compte.',
      type: types[action] || 'info',
      category: 'user',
      data: { action, adminName }
    });
  }

  /**
   * Notification système pour admins
   */
  async createSystemNotificationForAdmins(title, message, type = 'info', data = null) {
    try {
      // Récupérer tous les admins actifs
      const activeAdmins = await this.prisma.admin.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      if (activeAdmins.length === 0) {
        console.warn('Aucun admin actif trouvé pour notification système');
        return [];
      }

      // Créer une notification pour chaque admin
      const notifications = await Promise.all(
        activeAdmins.map(admin => 
          this.createNotification({
            adminId: admin.id,
            title,
            message,
            type,
            category: 'system',
            data
          })
        )
      );

      return notifications;

    } catch (error) {
      console.error('Erreur lors de la création de notifications système:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;