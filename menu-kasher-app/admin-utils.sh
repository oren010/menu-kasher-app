#!/bin/bash

# Script utilitaire pour l'administration de Menu Kasher
# Usage: ./admin-utils.sh [command]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
DB_HOST="172.17.0.1"
DB_PORT="15432"
DB_NAME="menu_kasher"
DB_USER="menu_user"
DB_PASSWORD="menu_password"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier le statut des services
check_status() {
    log_info "Vérification du statut des services..."
    
    echo "=== Conteneurs Docker ==="
    docker compose ps
    
    echo -e "\n=== Connectivité PostgreSQL ==="
    if nc -z $DB_HOST $DB_PORT; then
        log_success "PostgreSQL accessible sur $DB_HOST:$DB_PORT"
    else
        log_error "PostgreSQL non accessible"
        exit 1
    fi
    
    echo -e "\n=== API Menu Kasher ==="
    if curl -s http://172.17.0.1:13001/api/stats > /dev/null; then
        API_STATS=$(curl -s http://172.17.0.1:13001/api/stats)
        log_success "API accessible: $API_STATS"
    else
        log_error "API non accessible"
        exit 1
    fi
}

# Sauvegarder la base de données
backup_db() {
    log_info "Sauvegarde de la base de données..."
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/menu_kasher_backup_$TIMESTAMP.sql"
    
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Sauvegarde créée: $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
    else
        log_error "Erreur lors de la sauvegarde"
        exit 1
    fi
}

# Restaurer la base de données
restore_db() {
    if [ -z "$1" ]; then
        log_error "Usage: $0 restore <fichier_backup.sql>"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Fichier de sauvegarde non trouvé: $BACKUP_FILE"
        exit 1
    fi
    
    log_warning "⚠️  Attention: Cette opération va écraser toutes les données existantes!"
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restauration annulée"
        exit 0
    fi
    
    log_info "Restauration de la base de données..."
    
    # Supprimer et recréer la base
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE $DB_NAME;"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    # Restaurer les données
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Base de données restaurée avec succès"
    else
        log_error "Erreur lors de la restauration"
        exit 1
    fi
}

# Réinitialiser la base de données
reset_db() {
    log_warning "⚠️  Attention: Cette opération va supprimer toutes les données!"
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Réinitialisation annulée"
        exit 0
    fi
    
    log_info "Réinitialisation de la base de données..."
    
    # Redémarrer les conteneurs pour appliquer les migrations
    docker compose restart menu-kasher-app
    
    log_success "Base de données réinitialisée"
}

# Afficher les logs
show_logs() {
    SERVICE=${1:-"menu-kasher-app"}
    log_info "Affichage des logs pour le service: $SERVICE"
    docker compose logs -f --tail=50 "$SERVICE"
}

# Se connecter à PostgreSQL
connect_db() {
    log_info "Connexion à PostgreSQL..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
}

# Afficher l'aide
show_help() {
    echo "Menu Kasher - Script d'administration"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commandes disponibles:"
    echo "  status          Vérifier le statut des services"
    echo "  backup          Sauvegarder la base de données"
    echo "  restore <file>  Restaurer une sauvegarde"
    echo "  reset           Réinitialiser la base de données"
    echo "  logs [service]  Afficher les logs (défaut: menu-kasher-app)"
    echo "  connect         Se connecter à PostgreSQL"
    echo "  help            Afficher cette aide"
    echo
    echo "Exemples:"
    echo "  $0 status"
    echo "  $0 backup"
    echo "  $0 restore ./backups/menu_kasher_backup_20250724_101500.sql"
    echo "  $0 logs postgres"
}

# Menu principal
case "${1:-help}" in
    "status")
        check_status
        ;;
    "backup")
        backup_db
        ;;
    "restore")
        restore_db "$2"
        ;;
    "reset")
        reset_db
        ;;
    "logs")
        show_logs "$2"
        ;;
    "connect")
        connect_db
        ;;
    "help"|*)
        show_help
        ;;
esac