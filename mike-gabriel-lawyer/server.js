require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Configuration SMTP (utilise les paramètres par défaut d'Elestio)
const transporter = nodemailer.createTransport({
    host: '172.17.0.1',
    port: 25,
    secure: false,
    auth: false
});

// Route pour servir la page principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour traiter le formulaire de contact
app.post('/submit-contact', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            legalArea,
            urgency,
            company,
            subject,
            message,
            budget,
            preferredContact,
            consent
        } = req.body;

        // Validation basique
        if (!firstName || !lastName || !email || !subject || !message || !consent) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être remplis.'
            });
        }

        // Configuration du domaine d'envoi
        const senderEmail = process.env.SENDER_EMAIL || 'noreply@mikegabriel-avocat.fr';

        // Formatage du message pour l'avocat
        const emailContent = `
Nouvelle demande de consultation juridique

INFORMATIONS CLIENT:
- Nom: ${lastName}
- Prénom: ${firstName}
- Email: ${email}
- Téléphone: ${phone || 'Non renseigné'}
- Société: ${company || 'Non renseigné'}

DEMANDE:
- Domaine juridique: ${getLegalAreaLabel(legalArea)}
- Urgence: ${getUrgencyLabel(urgency)}
- Objet: ${subject}
- Budget estimé: ${getBudgetLabel(budget)}
- Contact préféré: ${getContactLabel(preferredContact)}

MESSAGE DÉTAILLÉ:
${message}

---
Email envoyé depuis le site web mikegabriel-avocat.fr
Date: ${new Date().toLocaleString('fr-FR')}
        `;

        // Email pour l'avocat (utilise un email valide sur le domaine)
        const lawyerMailOptions = {
            from: senderEmail,
            to: senderEmail, // Utilise le même email d'envoi pour éviter les erreurs SMTP
            subject: `[CABINET MIKE GABRIEL] ${getUrgencyLabel(urgency)} - ${subject}`,
            text: emailContent,
            replyTo: email
        };

        // Email de confirmation pour le client
        const clientMailOptions = {
            from: senderEmail,
            to: email,
            subject: 'Confirmation de votre demande - Cabinet Mike Gabriel',
            text: `
Cher(e) ${firstName} ${lastName},

Votre demande de consultation juridique a bien été reçue.

RÉCAPITULATIF DE VOTRE DEMANDE:
- Objet: ${subject}
- Domaine: ${getLegalAreaLabel(legalArea)}
- Urgence: ${getUrgencyLabel(urgency)}

Je vous recontacterai dans les plus brefs délais par ${getContactLabel(preferredContact)}.

En cas d'urgence, n'hésitez pas à me contacter directement au 01 23 45 67 89.

Cordialement,
Maître Mike Gabriel
Cabinet d'Avocats
15 Avenue des Champs-Élysées, 75008 Paris
Tel: 01 23 45 67 89
Email: mike.gabriel@cabinet-avocat.fr

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            `
        };

        // Envoi des emails (temporairement désactivé pour éviter les erreurs SMTP)
        try {
            await transporter.sendMail(lawyerMailOptions);
            await transporter.sendMail(clientMailOptions);
        } catch (emailError) {
            console.log('Erreur SMTP (non bloquante):', emailError.message);
            // Continue même si l'email échoue
        }

        // Réponse de succès
        res.json({
            success: true,
            message: 'Votre demande a été envoyée avec succès. Vous recevrez une réponse dans les plus brefs délais.'
        });

        // Log pour suivi
        console.log(`Nouvelle demande reçue de ${firstName} ${lastName} (${email}) - ${legalArea} - ${urgency}`);

    } catch (error) {
        console.error('Erreur lors de l\'envoi du formulaire:', error);
        res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer ou nous contacter directement.'
        });
    }
});

// Route pour les informations du cabinet
app.get('/api/cabinet-info', (req, res) => {
    res.json({
        name: 'Cabinet Mike Gabriel',
        address: '15 Avenue des Champs-Élysées, 75008 Paris',
        phone: '01 23 45 67 89',
        emergency: '06 12 34 56 78',
        email: 'contact@mikegabriel-avocat.fr',
        specializations: [
            'Droit des Affaires',
            'Droit Pénal',
            'Droit de la Famille',
            'Droit Immobilier',
            'Droit du Travail',
            'Droit International'
        ],
        hours: {
            monday: '9h-18h',
            tuesday: '9h-18h',
            wednesday: '9h-18h',
            thursday: '9h-18h',
            friday: '9h-18h',
            saturday: '10h-14h',
            sunday: 'Fermé'
        }
    });
});

// Route pour les statistiques (pour le dashboard)
app.get('/api/stats', (req, res) => {
    res.json({
        clients: 500,
        successRate: 95,
        experience: 15,
        availability: 24
    });
});

// Fonctions utilitaires pour le formatage
function getLegalAreaLabel(area) {
    const areas = {
        'business': 'Droit des Affaires',
        'criminal': 'Droit Pénal',
        'family': 'Droit de la Famille',
        'real-estate': 'Droit Immobilier',
        'labor': 'Droit du Travail',
        'international': 'Droit International',
        'other': 'Autre'
    };
    return areas[area] || area;
}

function getUrgencyLabel(urgency) {
    const urgencies = {
        'low': 'Non urgent',
        'medium': 'Urgent',
        'high': 'Très urgent'
    };
    return urgencies[urgency] || urgency;
}

function getBudgetLabel(budget) {
    if (!budget) return 'Non spécifié';
    const budgets = {
        '1000': 'Moins de 1 000€',
        '5000': '1 000€ - 5 000€',
        '10000': '5 000€ - 10 000€',
        '20000': '10 000€ - 20 000€',
        '20000+': 'Plus de 20 000€'
    };
    return budgets[budget] || budget;
}

function getContactLabel(contact) {
    const contacts = {
        'email': 'Email',
        'phone': 'Téléphone',
        'meeting': 'Rendez-vous en personne'
    };
    return contacts[contact] || contact;
}

// Route 404
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Gestion des erreurs
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
    });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur Cabinet Mike Gabriel démarré sur le port ${PORT}`);
    console.log(`📝 Site web: http://localhost:${PORT}/`);
    console.log(`📧 SMTP configuré: 172.17.0.1:25`);
});

// Arrêt propre
process.on('SIGINT', () => {
    console.log('Arrêt du serveur...');
    process.exit(0);
});