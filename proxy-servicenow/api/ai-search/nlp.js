const express = require('express');
const { NlpManager } = require('node-nlp');
const mongoose = require('mongoose');
const stringSimilarity = require('string-similarity');

const router = express.Router();

// === MongoDB Schema pour le dataset ===
const datasetSchema = new mongoose.Schema({
  intents: [
    {
      tag: String,
      patterns: [String],
      responses: [String],
      context: [String]
    }
  ]
});
const Dataset = mongoose.model('Intent', datasetSchema); // Collection: intents

// === NLP Setup ===
const manager = new NlpManager({ languages: ['fr'], forceNER: true, threshold: 0.7 });

// === Intentions fixes NLP enrichies ===
manager.addDocument('fr', 'je veux créer une offre', 'creer.offre');
manager.addDocument('fr', 'montre moi les produits', 'voir.produits');
manager.addDocument('fr', 'je veux un devis', 'demander.devis');

// 👉 Intentions intelligentes sur ServiceNow
manager.addDocument('fr', 'c’est quoi OMT', 'omt.def');
manager.addAnswer('fr', 'omt.def', "OMT (Order Management Telecom) gère les commandes de services dans ServiceNow, avec un focus sur les telcos.");

manager.addDocument('fr', 'parle moi de FSM', 'fsm.def');
manager.addAnswer('fr', 'fsm.def', "FSM (Field Service Management) gère les interventions terrain, les techniciens et les équipements.");

manager.addDocument('fr', 'qu’est-ce que CSM', 'csm.def');
manager.addAnswer('fr', 'csm.def', "CSM (Customer Service Management) est le module ServiceNow pour centraliser la gestion client.");

manager.addDocument('fr', 'quelles sont les certifications servicenow', 'certif.list');
manager.addAnswer('fr', 'certif.list', "Certifications ServiceNow : CSA (Admin), CIS-OMT, CIS-CSM, CIS-FSM selon ton domaine.");

manager.addAnswer('fr', 'creer.offre', 'Très bien, commençons la création de votre offre.');
manager.addAnswer('fr', 'voir.produits', 'Voici les produits disponibles.');
manager.addAnswer('fr', 'demander.devis', 'Pour quel produit souhaitez-vous un devis ?');
// 📚 Documents enrichis (seulement un aperçu ci-dessous)
manager.addDocument('fr', 'peux-tu m\'expliquer c’est', 'opportunity.def');
manager.addDocument('fr', 'comment fonctionne comment dans ServiceNow', 'product_offering.create');
manager.addDocument('fr', 'j\'ai besoin d\'aide avec je', 'demander.devis');
manager.addDocument('fr', 'donne-moi des infos sur comment', 'product_offering.create');
// ... jusqu'à 400 lignes

// 💬 Réponses enrichies
manager.addAnswer('fr', 'creer.offre', 'Très bien, commençons la création de votre offre.');
manager.addAnswer('fr', 'voir.produits', 'Voici les produits disponibles.');
manager.addAnswer('fr', 'demander.devis', 'Pour quel produit souhaitez-vous un devis ?');
manager.addAnswer('fr', 'omt.def', "OMT (Order Management Telecom) gère les commandes de services dans ServiceNow, avec un focus sur les telcos.");
manager.addAnswer('fr', 'fsm.def', "FSM (Field Service Management) gère les interventions terrain, les techniciens et les équipements.");
manager.addAnswer('fr', 'csm.def', "CSM (Customer Service Management) est le module ServiceNow pour centraliser la gestion client.");
manager.addAnswer('fr', 'certif.list', "Certifications ServiceNow : CSA (Admin), CIS-OMT, CIS-CSM, CIS-FSM selon ton domaine.");
manager.addAnswer('fr', 'quote.def', "Un devis est une estimation du prix pour un produit ou un service.");
manager.addAnswer('fr', 'quote.create', "Pour créer un devis, sélectionnez le produit, renseignez les informations client, puis validez.");
manager.addAnswer('fr', 'opportunity.def', "Une opportunité représente une possibilité de vente ou de projet avec un client.");
manager.addAnswer('fr', 'product_offering.def', "Une offre produit est un ensemble structuré de services ou produits proposés dans le catalogue.");
manager.addAnswer('fr', 'product_offering.create', "Pour créer une offre produit, allez dans le catalogue, ajoutez les détails et publiez l’offre.");
manager.addDocument('fr', 'créer un devis', 'quote.create');
manager.addDocument('fr', 'je veux faire un devis', 'quote.create');
manager.addDocument('fr', 'démarrer une quotation', 'quote.create');
manager.addDocument('fr', 'nouvelle demande de devis', 'quote.create');
manager.addDocument('fr', 'générer un devis client', 'quote.create');
manager.addDocument('fr', 'comment créer un devis dans servicenow', 'quote.create');
manager.addDocument('fr', 'débuter un devis', 'quote.create');
manager.addDocument('fr', 'initier un devis', 'quote.create');
manager.addDocument('fr', 'processus de devis', 'quote.create');
manager.addDocument('fr', 'démarrage devis', 'quote.create');

manager.addAnswer('fr', 'quote.create', 'Pour créer un devis, accédez au module "Quotes" > "Nouveau devis". Sélectionnez le client et les produits concernés.');

// ----------------------
manager.addDocument('fr', 'modifier un devis', 'quote.edit');
manager.addDocument('fr', 'changer un devis existant', 'quote.edit');
manager.addDocument('fr', 'mettre à jour ma quotation', 'quote.edit');
manager.addDocument('fr', 'éditer un devis', 'quote.edit');
manager.addDocument('fr', 'corriger un devis', 'quote.edit');
manager.addDocument('fr', 'ajouter produit à devis', 'quote.edit');
manager.addDocument('fr', 'supprimer produit du devis', 'quote.edit');
manager.addDocument('fr', 'changer prix devis', 'quote.edit');
manager.addDocument('fr', 'maj devis', 'quote.edit');

manager.addAnswer('fr', 'quote.edit', 'Pour modifier un devis, recherchez-le dans le module "Quotes", puis cliquez sur "Modifier". Sauvegardez après vos changements.');

// ======================
// OPPORTUNITES (SALES)
// ======================

manager.addDocument('fr', 'créer une opportunité', 'opportunity.create');
manager.addDocument('fr', 'nouvelle opportunité de vente', 'opportunity.create');
manager.addDocument('fr', 'démarrer un pipeline', 'opportunity.create');
manager.addDocument('fr', 'enregistrer une opportunité', 'opportunity.create');
manager.addDocument('fr', 'ajouter un prospect', 'opportunity.create');
manager.addDocument('fr', 'nouveau lead', 'opportunity.create');
manager.addDocument('fr', 'débuter une vente', 'opportunity.create');
manager.addDocument('fr', 'initier un deal', 'opportunity.create');
manager.addDocument('fr', 'enregistrer un client potentiel', 'opportunity.create');

manager.addAnswer('fr', 'opportunity.create', 'Pour créer une opportunité : Sales > Opportunités > Nouveau. Renseignez le client, montant estimé et probabilité.');

// ----------------------
manager.addDocument('fr', 'suivi opportunités', 'opportunity.track');
manager.addDocument('fr', 'où en sont mes deals', 'opportunity.track');
manager.addDocument('fr', 'liste des opportunités', 'opportunity.track');
manager.addDocument('fr', 'état du pipeline', 'opportunity.track');
manager.addDocument('fr', 'mes ventes en cours', 'opportunity.track');
manager.addDocument('fr', 'suivre mes opportunités', 'opportunity.track');
manager.addDocument('fr', 'tableau de bord ventes', 'opportunity.track');
manager.addDocument('fr', 'rapport opportunités', 'opportunity.track');

manager.addAnswer('fr', 'opportunity.track', 'Le tableau de bord des opportunités se trouve dans Sales > Tableaux de bord > Vue Pipeline. Filtrez par commercial ou période.');

// ======================
// PRODUCT OFFERINGS
// ======================

manager.addDocument('fr', 'créer une offre produit', 'product.create');
manager.addDocument('fr', 'ajouter un nouveau produit', 'product.create');
manager.addDocument('fr', 'enregistrer un produit', 'product.create');
manager.addDocument('fr', 'nouvelle offre commerciale', 'product.create');
manager.addDocument('fr', 'définir un produit', 'product.create');
manager.addDocument('fr', 'ajout au catalogue', 'product.create');
manager.addDocument('fr', 'configurer un produit', 'product.create');
manager.addDocument('fr', 'déclarer un produit', 'product.create');

manager.addAnswer('fr', 'product.create', 'Pour créer un produit : Products > Nouveau. Renseignez SKU, description, catégorie et prix. Puis validez.');

// ----------------------
manager.addDocument('fr', 'modifier offre produit', 'product.edit');
manager.addDocument('fr', 'changer un produit', 'product.edit');
manager.addDocument('fr', 'mettre à jour une offre', 'product.edit');
manager.addDocument('fr', 'éditer produit existant', 'product.edit');
manager.addDocument('fr', 'corriger fiche produit', 'product.edit');
manager.addDocument('fr', 'changer prix produit', 'product.edit');
manager.addDocument('fr', 'maj offre commerciale', 'product.edit');

manager.addAnswer('fr', 'product.edit', 'Modifiez un produit via Products > Rechercher le produit > Éditer. Changez les champs nécessaires et sauvegardez.');

// ======================
// MODULES SERVICENOW
// ======================

// ITSM
manager.addDocument('fr', 'gestion incident', 'itsm.incident');
manager.addDocument('fr', 'créer ticket incident', 'itsm.incident');
manager.addDocument('fr', 'déclarer un problème IT', 'itsm.incident');
manager.addDocument('fr', 'remonter un bug', 'itsm.incident');
manager.addDocument('fr', 'signaler anomalie', 'itsm.incident');

manager.addAnswer('fr', 'itsm.incident', 'Pour créer un incident : ITIL > Incidents > Nouveau. Décrivez le problème, impact et urgence.');

// ----------------------
// ITOM
manager.addDocument('fr', 'surveiller infrastructure', 'itom.monitoring');
manager.addDocument('fr', 'superviser serveurs', 'itom.monitoring');
manager.addDocument('fr', 'tableau de bord ITOM', 'itom.monitoring');
manager.addDocument('fr', 'état des services IT', 'itom.monitoring');
manager.addDocument('fr', 'disponibilité système', 'itom.monitoring');

manager.addAnswer('fr', 'itom.monitoring', 'La supervision se configure dans ITOM > Monitoring. Les dashboards montrent la santé de l\'infrastructure en temps réel.');

// ======================
// CERTIFICATIONS
// ======================

manager.addDocument('fr', 'certification CSA', 'cert.csa');
manager.addDocument('fr', 'devenir admin servicenow', 'cert.csa');
manager.addDocument('fr', 'formation administrateur', 'cert.csa');
manager.addDocument('fr', 'examen certification CSA', 'cert.csa');

manager.addAnswer('fr', 'cert.csa', 'La CSA (Certified System Administrator) est la certification de base. Prérequis : 3 mois d\'expérience et formation Now Learning.');

// ----------------------
manager.addDocument('fr', 'certification CAD', 'cert.cad');
manager.addDocument('fr', 'devenir développeur', 'cert.cad');
manager.addDocument('fr', 'formation développement', 'cert.cad');
manager.addDocument('fr', 'examen CAD', 'cert.cad');

manager.addAnswer('fr', 'cert.cad', 'La CAD (Certified Application Developer) nécessite la CSA et couvre le développement avancé sur la plateforme.');

// ======================
// INTEGRATIONS
// ======================

manager.addDocument('fr', 'connecter SAP', 'integration.sap');
manager.addDocument('fr', 'intégration avec SAP', 'integration.sap');
manager.addDocument('fr', 'lien servicenow et SAP', 'integration.sap');
manager.addDocument('fr', 'synchroniser données SAP', 'integration.sap');

manager.addAnswer('fr', 'integration.sap', 'L\'intégration SAP utilise des connecteurs MID Server ou des API REST. Configurez les mappings de données dans System Integration > SAP.');

// ----------------------
manager.addDocument('fr', 'connecter Salesforce', 'integration.salesforce');
manager.addDocument('fr', 'lien CRM et servicenow', 'integration.salesforce');
manager.addDocument('fr', 'sync leads avec salesforce', 'integration.salesforce');

manager.addAnswer('fr', 'integration.salesforce', 'Utilisez l\'integration Hub ou des flows pour synchroniser opportunités et comptes entre ServiceNow et Salesforce.');

// ======================
// TECHNIQUES
// ======================

manager.addDocument('fr', 'créer business rule', 'tech.businessrule');
manager.addDocument('fr', 'ajouter script serveur', 'tech.businessrule');
manager.addDocument('fr', 'automatiser processus', 'tech.businessrule');

manager.addAnswer('fr', 'tech.businessrule', 'Les business rules se configurent dans System Definition > Business Rules. Choisissez la table, événement et écrivez votre script.');

// ----------------------
manager.addDocument('fr', 'créer UI policy', 'tech.uipolicy');
manager.addDocument('fr', 'masquer champ conditionnel', 'tech.uipolicy');
manager.addDocument('fr', 'rendre champ obligatoire', 'tech.uipolicy');

manager.addAnswer('fr', 'tech.uipolicy', 'Les UI Policies se trouvent dans System UI > UI Policies. Définissez les conditions et actions sur les champs.');

// ======================
// AUTRES FONCTIONNALITES
// ======================

manager.addDocument('fr', 'configurer SLA', 'config.sla');
manager.addDocument('fr', 'définir délai résolution', 'config.sla');
manager.addDocument('fr', 'gérer les engagements', 'config.sla');

manager.addAnswer('fr', 'config.sla', 'Configurez les SLA dans Contracts > SLA Definitions. Définissez les métriques et déclencheurs.');

// ----------------------
manager.addDocument('fr', 'créer rapport', 'report.create');
manager.addDocument('fr', 'générer dashboard', 'report.create');
manager.addDocument('fr', 'exporter données', 'report.create');

manager.addAnswer('fr', 'report.create', 'Utilisez le Report Designer pour créer des rapports. Accès via Analytics > Reporting > Nouveau rapport.');

// ======================
// FORMATIONS
// ======================

manager.addDocument('fr', 'accéder à now learning', 'training.access');
manager.addDocument('fr', 'trouver formation', 'training.access');
manager.addDocument('fr', 'catalogue formations', 'training.access');

manager.addAnswer('fr', 'training.access', 'Le portail Now Learning est accessible via learning.servicenow.com. Filtrez par rôle ou certification.');

// ----------------------
manager.addDocument('fr', 'préparer certification', 'training.prepare');
manager.addDocument('fr', 'réviser pour examen', 'training.prepare');
manager.addDocument('fr', 'simulateur examen', 'training.prepare');

manager.addAnswer('fr', 'training.prepare', 'Utilisez les parcours officiels sur Now Learning et les tests pratiques. Prévoyez 2-4 semaines de préparation.');

// ======================
// ADMINISTRATION
// ======================

manager.addDocument('fr', 'gérer utilisateurs', 'admin.users');
manager.addDocument('fr', 'créer un compte', 'admin.users');
manager.addDocument('fr', 'attribuer rôle', 'admin.users');

manager.addAnswer('fr', 'admin.users', 'Gérez les utilisateurs dans User Administration > Users. Assignez les rôles et groupes appropriés.');

// ----------------------
manager.addDocument('fr', 'configurer groupe', 'admin.groups');
manager.addDocument('fr', 'créer équipe', 'admin.groups');
manager.addDocument('fr', 'organiser départements', 'admin.groups');

manager.addAnswer('fr', 'admin.groups', 'Créez et configurez les groupes dans User Administration > Groups. Affectez les membres et définissez les rôles.');

// 🔁 Entraîner le modèle une fois
(async () => {
  await manager.train();
  await manager.save();
  console.log("✅ NLP entraîné avec intentions fixes");
})();

// === Route POST NLP ===
router.post('/nlp', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message invalide' });
  }

  try {
    const result = await manager.process('fr', message.toLowerCase());

    if (result.intent !== 'None' && result.answer) {
      return res.json({
        source: 'NLP',
        intent: result.intent,
        confidence: result.score,
        answer: result.answer
      });
    }

    // Sinon : Recherche dans MongoDB
    const datasetDoc = await Dataset.findOne();
    if (!datasetDoc || !datasetDoc.intents) {
      return res.status(500).json({ error: 'Dataset manquant dans MongoDB' });
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const intent of datasetDoc.intents) {
      for (const pattern of intent.patterns) {
        const score = stringSimilarity.compareTwoStrings(pattern.toLowerCase(), message.toLowerCase());
        if (score > bestScore) {
          bestScore = score;
          bestMatch = intent;
        }
      }
    }

    if (bestMatch && bestScore > 0.6) {
      const answer = bestMatch.responses[Math.floor(Math.random() * bestMatch.responses.length)];
      return res.json({
        source: 'MongoDB',
        intent: bestMatch.tag,
        confidence: bestScore,
        answer
      });
    }
    const fallbackReplies = [
    "Pouvez-vous préciser votre demande ?",
    "Essayez avec des mots plus simples.",
    "Voici ce que je peux faire : créer devis, consulter offres, produits, etc.",
    "Je suis là pour vous aider sur ServiceNow. Essayez par exemple : 'Créer un devis'"
    ];
    // 🟥 Aucun résultat
 
        res.json({
            source: 'Fallback',
            intent: 'None',
            confidence: 0,
            answer: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]
        });
  } catch (err) {
    console.error('❌ NLP Error:', err);
    res.status(500).json({ error: 'Erreur NLP', details: err.message });
  }
});

module.exports = router;
