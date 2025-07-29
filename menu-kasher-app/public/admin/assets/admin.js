/**
 * JavaScript principal pour l'administration
 * Menu Kasher Familial - Interface Admin
 */

// Configuration globale
const ADMIN_CONFIG = {
  API_BASE: '/api',
  AUTH_API: '/api/auth',
  STORAGE_PREFIX: 'menuKasherAdmin_',
  TOKEN_KEY: 'adminToken',
  USER_KEY: 'adminUser',
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  SESSION_WARNING: 15 * 60 * 1000, // 15 minutes avant expiration
};

// État global de l'application
let adminApp = {
  user: null,
  token: null,
  permissions: [],
  role: null,
  isAuthenticated: false,
  notifications: [],
  sidebarCollapsed: false,
};

// Utilitaires
const Utils = {
  // Stockage local avec préfixe
  storage: {
    get: (key) => localStorage.getItem(ADMIN_CONFIG.STORAGE_PREFIX + key),
    set: (key, value) => localStorage.setItem(ADMIN_CONFIG.STORAGE_PREFIX + key, value),
    remove: (key) => localStorage.removeItem(ADMIN_CONFIG.STORAGE_PREFIX + key),
    clear: () => {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(ADMIN_CONFIG.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  // Requêtes API avec authentification
  api: {
    async request(endpoint, options = {}) {
      const token = Utils.storage.get(ADMIN_CONFIG.TOKEN_KEY);
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        }
      };

      const response = await fetch(ADMIN_CONFIG.API_BASE + endpoint, {
        ...defaultOptions,
        ...options
      });

      // Gestion des erreurs d'authentification
      if (response.status === 401) {
        await Auth.logout();
        window.location.href = 'login.html';
        throw new Error('Session expirée');
      }

      // Gestion du rate limiting
      if (response.status === 429) {
        console.warn('Rate limited - tentative d\'accès trop fréquente');
        throw new Error('RATE_LIMITED');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        throw new Error(error.message || `Erreur ${response.status}`);
      }

      return response.json();
    },

    get: (endpoint) => Utils.api.request(endpoint),
    post: (endpoint, data) => Utils.api.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    put: (endpoint, data) => Utils.api.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (endpoint) => Utils.api.request(endpoint, { method: 'DELETE' })
  },

  // Formatage des dates
  formatDate: (date, options = {}) => {
    const d = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return d.toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
  },

  // Formatage des nombres
  formatNumber: (number, locale = 'fr-FR') => {
    return new Intl.NumberFormat(locale).format(number);
  },

  // Debounce pour les recherches
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Notification toast
  toast: (message, type = 'info', duration = 5000) => {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    
    const iconMap = {
      success: 'check-circle',
      danger: 'exclamation-triangle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${iconMap[type] || 'info-circle'} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: duration });
    bsToast.show();
    
    // Nettoyer après disparition
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });

    function createToastContainer() {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1055';
      document.body.appendChild(container);
      return container;
    }
  }
};

// Système d'authentification
const Auth = {
  // Initialiser l'authentification
  async init() {
    const token = Utils.storage.get(ADMIN_CONFIG.TOKEN_KEY);
    const userData = Utils.storage.get(ADMIN_CONFIG.USER_KEY);
    
    if (token && userData) {
      try {
        adminApp.token = token;
        adminApp.user = JSON.parse(userData);
        adminApp.permissions = adminApp.user.permissions || [];
        adminApp.role = adminApp.user.role;
        adminApp.isAuthenticated = true;
        
        // Vérifier la validité du token - DÉSACTIVÉ temporairement
        // await Utils.api.get('/auth/admin/me');
        
        // Démarrer le rafraîchissement automatique
        Auth.startTokenRefresh();
        
        return true;
      } catch (error) {
        console.error('Erreur de vérification du token:', error);
        
        // Si c'est un rate limiting, ne pas déconnecter - juste continuer
        if (error.message === 'RATE_LIMITED') {
          console.warn('Rate limited lors de la vérification auth - session conservée');
          // Démarrer le rafraîchissement automatique quand même
          Auth.startTokenRefresh();
          return true;
        }
        
        // Pour toute autre erreur, déconnecter
        await Auth.logout();
        return false;
      }
    }
    
    return false;
  },

  // Déconnexion
  async logout() {
    try {
      // Appeler l'API de déconnexion
      await Utils.api.post('/auth/admin/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
    
    // Nettoyer le stockage local
    Utils.storage.clear();
    
    // Réinitialiser l'état
    adminApp.user = null;
    adminApp.token = null;
    adminApp.permissions = [];
    adminApp.role = null;
    adminApp.isAuthenticated = false;
    
    // Rediriger vers la page de connexion
    window.location.href = 'login.html';
  },

  // Vérifier une permission
  hasPermission(permission) {
    return adminApp.permissions.includes(permission);
  },

  // Vérifier un rôle
  hasRole(role) {
    return adminApp.role === role;
  },

  // Démarrer le rafraîchissement automatique du token
  startTokenRefresh() {
    setInterval(async () => {
      try {
        const response = await Utils.api.post('/auth/admin/refresh-token');
        if (response.accessToken) {
          Utils.storage.set(ADMIN_CONFIG.TOKEN_KEY, response.accessToken);
          adminApp.token = response.accessToken;
        }
      } catch (error) {
        console.error('Erreur de rafraîchissement du token:', error);
        await Auth.logout();
      }
    }, ADMIN_CONFIG.REFRESH_INTERVAL);
  }
};

// Gestion de la sidebar
const Sidebar = {
  init() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    this.setActivePage(currentPage);
    this.filterByPermissions();
  },

  setActivePage(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.page === page) {
        link.classList.add('active');
      }
    });
    
    // Mettre à jour le breadcrumb
    const breadcrumb = document.getElementById('currentPage');
    if (breadcrumb) {
      const activeLink = document.querySelector('.nav-link.active .nav-link-text');
      if (activeLink) {
        breadcrumb.textContent = activeLink.textContent;
      }
    }
  },

  filterByPermissions() {
    document.querySelectorAll('.nav-link[data-permission]').forEach(link => {
      const permission = link.dataset.permission;
      if (!Auth.hasPermission(permission)) {
        link.style.display = 'none';
      }
    });
  },

  toggle() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth <= 992) {
      // Mode mobile
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    } else {
      // Mode desktop
      adminApp.sidebarCollapsed = !adminApp.sidebarCollapsed;
      Utils.storage.set('sidebarCollapsed', adminApp.sidebarCollapsed.toString());
    }
  }
};

// Gestion des notifications
const Notifications = {
  async load() {
    try {
      // Simuler le chargement des notifications
      // TODO: Implémenter l'API réelle
      adminApp.notifications = [
        {
          id: 1,
          title: 'Nouvel utilisateur inscrit',
          message: 'Un utilisateur s\'est inscrit il y a 5 minutes',
          type: 'info',
          read: false,
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          id: 2,
          title: 'Tentative de connexion échouée',
          message: 'Plusieurs tentatives de connexion ont échoué',
          type: 'warning',
          read: false,
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        }
      ];
      
      this.updateUI();
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  },

  updateUI() {
    const badge = document.getElementById('notificationCount');
    const list = document.getElementById('notificationsList');
    
    const unreadCount = adminApp.notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
    
    if (list) {
      if (adminApp.notifications.length === 0) {
        list.innerHTML = `
          <div class="dropdown-item-text text-muted text-center py-3">
            <i class="bi bi-bell-slash mb-2 d-block fs-4"></i>
            Aucune notification
          </div>
        `;
      } else {
        list.innerHTML = adminApp.notifications.map(notification => `
          <div class="notification-item ${!notification.read ? 'unread' : ''}" data-id="${notification.id}">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-text">${notification.message}</div>
            <div class="notification-time">${Utils.formatDate(notification.timestamp, { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        `).join('');
      }
    }
  },

  async markAsRead(notificationId) {
    const notification = adminApp.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.updateUI();
      
      // TODO: Appeler l'API pour marquer comme lu
    }
  },

  async markAllAsRead() {
    adminApp.notifications.forEach(n => n.read = true);
    this.updateUI();
    
    // TODO: Appeler l'API pour marquer toutes comme lues
  }
};

// Gestion du profil utilisateur
const Profile = {
  init() {
    if (adminApp.user) {
      this.updateUI();
    }
  },

  updateUI() {
    const elements = {
      sidebarAdminName: document.getElementById('sidebarAdminName'),
      sidebarAdminRole: document.getElementById('sidebarAdminRole'),
      headerAdminName: document.getElementById('headerAdminName'),
      headerAdminEmail: document.getElementById('headerAdminEmail'),
      headerAdminRole: document.getElementById('headerAdminRole'),
      lastLoginTime: document.getElementById('lastLoginTime')
    };

    if (elements.sidebarAdminName) elements.sidebarAdminName.textContent = adminApp.user.name;
    if (elements.sidebarAdminRole) elements.sidebarAdminRole.textContent = this.getRoleDisplayName(adminApp.user.role);
    if (elements.headerAdminName) elements.headerAdminName.textContent = adminApp.user.name;
    if (elements.headerAdminEmail) elements.headerAdminEmail.textContent = adminApp.user.email;
    if (elements.headerAdminRole) elements.headerAdminRole.textContent = this.getRoleDisplayName(adminApp.user.role);
    
    if (elements.lastLoginTime && adminApp.user.lastLogin) {
      elements.lastLoginTime.textContent = Utils.formatDate(adminApp.user.lastLogin, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  },

  getRoleDisplayName(role) {
    const roleNames = {
      'super_admin': 'Super Administrateur',
      'content_admin': 'Gestionnaire de Contenu',
      'user_admin': 'Gestionnaire Utilisateurs',
      'analytics_admin': 'Analyste'
    };
    return roleNames[role] || role;
  }
};

// Gestion de la recherche globale
const Search = {
  init() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(this.performSearch.bind(this), 300));
    }
  },

  async performSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length < 2) {
      return;
    }

    try {
      // TODO: Implémenter la recherche globale
      console.log('Recherche:', query);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    }
  }
};

// Fonctions globales pour les événements
window.toggleSidebar = () => Sidebar.toggle();
window.logout = () => Auth.logout();

window.toggleNotifications = () => {
  const dropdown = document.getElementById('notificationsDropdown');
  const isVisible = dropdown.style.display !== 'none';
  
  // Fermer tous les autres dropdowns
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== dropdown) menu.style.display = 'none';
  });
  
  dropdown.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    Notifications.load();
  }
};

window.toggleProfileMenu = () => {
  const dropdown = document.getElementById('profileDropdown');
  const isVisible = dropdown.style.display !== 'none';
  
  // Fermer tous les autres dropdowns
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    if (menu !== dropdown) menu.style.display = 'none';
  });
  
  dropdown.style.display = isVisible ? 'none' : 'block';
};

window.markAllNotificationsRead = () => Notifications.markAllAsRead();

// Fermer les dropdowns en cliquant ailleurs
document.addEventListener('click', (e) => {
  if (!e.target.closest('.header-notifications') && !e.target.closest('.header-profile')) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.style.display = 'none';
    });
  }
});

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier l'authentification
  const isAuthenticated = await Auth.init();
  
  if (!isAuthenticated && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
    return;
  }
  
  if (isAuthenticated && window.location.pathname.includes('login.html')) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Initialiser les composants
  if (isAuthenticated) {
    Sidebar.init();
    Profile.init();
    Search.init();
    Notifications.load();
    
    // Charger le layout si nécessaire
    await Layout.load();
  }
});

// Gestion du layout dynamique
const Layout = {
  async load() {
    // Charger la sidebar si elle n'existe pas
    if (!document.getElementById('adminSidebar')) {
      await this.loadComponent('sidebar', 'layout/sidebar.html');
    }
    
    // Charger le header si il n'existe pas
    if (!document.querySelector('.admin-header')) {
      await this.loadComponent('header', 'layout/header.html', 'afterbegin');
    }
    
    // Réinitialiser après chargement
    Sidebar.init();
    Profile.init();
  },

  async loadComponent(id, path, position = 'beforeend') {
    try {
      const response = await fetch(path);
      const html = await response.text();
      
      if (position === 'afterbegin') {
        document.body.insertAdjacentHTML('afterbegin', html);
      } else {
        document.body.insertAdjacentHTML('beforeend', html);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de ${path}:`, error);
    }
  }
};

// Gestion des erreurs globales
window.addEventListener('error', (e) => {
  console.error('Erreur JavaScript:', e.error);
  Utils.toast('Une erreur technique est survenue.', 'danger');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejetée:', e.reason);
  Utils.toast('Une erreur est survenue lors de la communication avec le serveur.', 'danger');
});

// Export pour utilisation dans d'autres scripts
window.AdminApp = {
  adminApp,
  Utils,
  Auth,
  Sidebar,
  Notifications,
  Profile,
  Search
};