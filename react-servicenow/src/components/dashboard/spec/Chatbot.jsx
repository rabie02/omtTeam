import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
  // États du chatbot
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [loadingIntents, setLoadingIntents] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef(null);
  const [categories, setCategories] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // 🔽 Ajoutez cette fonction ici
  const getAuthHeaders = () => {
    let token = localStorage.getItem('access_token');
  
    // Si le token commence déjà par "Bearer ", on le nettoie
    if (token && token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    }
  
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };
  // Configuration ServiceNow
  const SN_CONFIG = {
    baseURL: 'https://dev323456.service-now.com',
    auth: {
      username: 'admin',
      password: 'bz!T-1ThIc1L'
    },
    endpoints: {
      searchKB: '/api/now/table/kb_knowledge',
      searchSpecs: '/api/now/table/sn_prd_pm_product_specification'
    }
  };

  // Mappage des intentions
  const INTENT_MAP = {
    product_search: 'search_products',
    quote_request: 'request_quote',
    price_check: 'check_price',
    opportunity_check: 'check_opportunity',
    channel_info: 'get_channel_info',
    product_by_spec: 'search_products_by_spec',
    category_list: 'list_categories',
    knowledge_base: 'search_kb',
    product_specs: 'search_specs'
  };

  // Chargement initial des catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/product-offering-category`, getAuthHeaders());
        setCategories(response.data.data || []); // Accéder à response.data.data
        initializeChat();
      } catch (error) {
        console.error('Error loading categories:', error);
        initializeChat();
      }
    };
    loadCategories();
  }, []);

  // Scroll automatique
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialisation du chat
  const initializeChat = () => {
    setMessages([{
      text: "Bonjour! Je suis votre assistant commercial. Je peux vous aider à trouver des produits, des devis, des prix et plus encore. Comment puis-je vous aider aujourd'hui?", 
      sender: 'bot',
      options: generateDefaultOptions()
    }]);
  };

  // Détection d'intention améliorée
  const detectIntent = (text) => {
    text = text.toLowerCase().trim();
    if (/^(créer|creer).*offre.*produit/.test(text)) return 'create_product_offering';
    // Détection basée sur le contenu du message
    if (/(bonjour|salut)/.test(text)) return 'greeting';
    if (/(produit|offre|article)/.test(text)) return 'search_products';
    if (/(prix|tarif)/.test(text)) return 'check_price';
    if (/(opportunit|affaire)/.test(text)) return 'check_opportunity';
    if (/(canal|channel)/.test(text)) return 'get_channel_info';
    if (/(liste.*spécification|voir.*spécification|spécifications?$)/.test(text)) return 'list_specs';
    if (/(catégorie|type|famille)/.test(text)) return 'list_categories';
    if (/(article|connaissance)/.test(text)) return 'search_kb';
    if (/(spécification|caractéristique)/.test(text)) return 'search_specs';
    if (/(menu|guide|principal)/.test(text)) return 'main_menu';
    if (/\b(case|cases)\b/.test(text)) return 'view_cases';
    if (/(voir.*devis|mes devis|liste.*devis)/.test(text)) return 'view_quotes';
    return 'help';
  };

  // Gestion de l'envoi de message
  const handleSendMessage = async () => {
  if (!input.trim() || loading) return;
  const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Déplacer la détection de "menu principal" ici
    if (input.toLowerCase().includes('menu principal')) {
      setCurrentStep(null);
      setTimeout(() => {
        addBotMessage("📋 Voici le menu principal :", generateDefaultOptions());
        setLoading(false);
      }, 300);
      return;
    }
    

  try {
    // 🛑 Si une étape est active (ex: création de product offering), continuer uniquement ce processus
    if (currentStep) {
      await processStepResponse(input);
      return;
    }

    // 🧠 Étape 1 : détecter l’intention métier
    const response = await processUserInput(input);

    // ✅ Forcer la séquence de création product_offering sans interruption
    if (response && response.intent === 'create_product_offering') {
      setMessages(prev => [...prev, response]);
      setCurrentStep('create_product_offering_select_category');
      return;
    }

    // 🧩 Si une autre intention métier valide (hors création d'offre)
    if (response && response.intent && response.intent !== 'help') {
      setMessages(prev => [...prev, response]);

      if (response.data) {
        setMessages(prev => [...prev, {
          text: response.text || "Voici les résultats :",
          sender: 'bot',
          isData: true,
          data: response.data,
          options: getFollowUpOptions(response.intent)
        }]);
      }
      return;
    }

    // 🤖 Étape 2 : NLP fallback
    const aiResponse = await queryNLPBackend(input);
    if (aiResponse && aiResponse.text?.trim()) {
      console.log("✅ Réponse NLP:", aiResponse);
      setMessages(prev => [...prev, aiResponse]);
      return;
    }

    // ❓ Aucun résultat
    addBotMessage("Je n’ai pas compris votre demande. Pouvez-vous reformuler ?", generateDefaultOptions());
    setMessages(prev => [...prev, handleHelp()]);

  } catch (error) {
    console.error("Erreur chatbot:", error);
    addBotMessage("Désolé, une erreur est survenue. Pouvez-vous reformuler votre demande ?");
  } finally {
    setLoading(false);
  }
};
const handleViewCases = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/chatbot/cases`, getAuthHeaders());
    const cases = response.data.cases || []; 
    console.log("📂 Cases reçus :", cases);
    return {
      text: cases.length ? "Voici vos cases :" : "Aucun case trouvé.",
      data: cases,
      intent: 'view_cases'
    };
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des cases :", error);
    return handleError("Erreur de récupération des cases.");
  }
};

  // Traitement de l'input utilisateur
  const processUserInput = async (userInput) => {
  const intent = detectIntent(userInput);

  switch(intent) {
    case 'search_products':
      return handleSearchProducts();
    case 'request_quote':
      return handleRequestQuote();
    case 'check_price':
      return handleCheckPrice();
    case 'check_opportunity':
      return handleCheckOpportunity();
    case 'get_channel_info':
      return handleGetChannelInfo();
    case 'search_products_by_spec':
      return handleSearchProductsBySpec();
    case 'list_categories':
      return handleListCategories();
    case 'search_kb':
      return handleSearchKB();
    case 'search_specs':
      return handleSearchSpecs();
    case 'greeting':
      return handleGreeting();
    case 'view_quotes':
      return handleViewQuotes();
    case 'view_cases':
      return await handleViewCases();
    case 'list_specs':
      return handleListAllSpecs();
    case 'main_menu':
      return handleMainMenu();
    case 'create_product_offering':
      return {
        intent: 'create_product_offering',
        text: "Souhaitez-vous créer une nouvelle offre produit ?",
        sender: 'bot',
        options: ["Oui", "Annuler"]
      };
    default:
      return handleHelp(); // ou null selon ton besoin
  }
};

  const handleMainMenu = () => {
    return {
      text: "Voici le menu principal. Comment puis-je vous aider ?",
      sender: 'bot',
      options: generateDefaultOptions()
    };
  };
  
  const handleViewQuotes = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/quote`, getAuthHeaders());
      const quotes = response.data.data || [];
      console.log("📄 Devis reçus :", quotes);
      return {
        text: quotes.length ? "Voici vos devis :" : "Aucun devis trouvé.",
        data: quotes,
        intent: 'view_quotes'
      };
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des devis :", error);
      return handleError("Erreur de récupération des devis");
    }
  };
  // Fonctions de gestion des intentions
  const handleSearchProducts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product-offering-catalog-publish`, getAuthHeaders());
      console.log("🧪 Réponse brute du backend :", response.data);
      
      const products = response.data.data;
      console.log("🔍 Produits extraits :", products); // 👈 Tu dois voir ici les 2 produits
  
      return {
        text: products.length ? "Voici nos offres produits disponibles:" : "Aucun produit trouvé.",
        data: products,
        intent: 'search_products'
      };
    } catch (error) {
      console.error("❌ Erreur handleSearchProducts:", error);
      return handleError("Erreur de recherche des produits");
    }
  };
  const handleListAllSpecs = async () => {
    try {
      const response = await axios.get(`${SN_CONFIG.baseURL}${SN_CONFIG.endpoints.searchSpecs}`, {
        auth: SN_CONFIG.auth,
        params: {
          sysparm_query: "status=published",
          sysparm_limit: 50,
          sysparm_fields: 'name,number,specification_type,display_name,description,status'
        }
      });
  
      const specs = response.data.result || [];
  
      return {
        text: specs.length ? "Voici les spécifications techniques publiées :" : "Aucune spécification trouvée.",
        data: specs,
        intent: 'list_specs'
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des spécifications :", error);
      return handleError("Erreur lors du chargement des spécifications");
    }
  };
  
  const handleRequestQuote = () => {
    setCurrentStep('quote_product_selection');
    return {
      text: "Pour quel produit souhaitez-vous un devis?",
      sender: 'bot',
      options: ["Annuler"]
    };
  };

  const handleCheckPrice = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/price-list`, getAuthHeaders());
      console.log("✅ Prix reçus du backend :", response.data); // déjà un tableau
      return {
        text: "Voici la liste des prix:",
        data: response.data, // ✅ utilise directement le tableau ici
        intent: 'check_price'
      };
    } catch (error) {
      console.error("❌ Erreur Axios:", error);
      return handleError("Erreur de récupération des prix");
    }
  };
 
  const queryNLPBackend = async (text) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/nlp`,
        { message: text },
        getAuthHeaders() // ✅ Ajoute les headers ici !
      );

      console.log("📡 NLP API response:", response.data);

      if (response.data && response.data.answer) {
        return {
          text: response.data.answer,
          sender: 'bot'
        };
      }
    } catch (error) {
      console.error("❌ Erreur NLP:", error);
    }

    return null;
  };


  const handleCheckOpportunity = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/opportunity`, getAuthHeaders());
      return {
        text: "Voici les opportunités disponibles:",
        data: response.data, // Ici response.data est déjà le tableau
        intent: 'check_opportunity'
      };
    } catch (error) {
      return handleError("Erreur de récupération des opportunités");
    }
  };

  const handleGetChannelInfo = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/channel`, getAuthHeaders());
      return {
        text: "Voici les informations sur les canaux:",
        data: response.data,
        intent: 'get_channel_info'
      };
    } catch (error) {
      return handleError("Erreur de récupération des canaux");
    }
  };

  const handleSearchProductsBySpec = () => {
    setCurrentStep('spec_input');
    return {
      text: "Veuillez entrer la spécification technique pour laquelle vous souhaitez trouver des produits:",
      sender: 'bot',
      options: ["Annuler"]
    };
  };

  const handleListCategories = () => ({
  text: categories.length 
    ? "Voici les catégories disponibles:" 
    : "Aucune catégorie disponible pour le moment.",
  data: categories,
  intent: 'list_categories'
});

  // Fonction pour rechercher dans la base de connaissances ServiceNow
  const searchKnowledgeArticles = async (query = '') => {
    try {
      const response = await axios.get(SN_CONFIG.endpoints.searchKB, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth,
        params: {
          sysparm_query: `active=true^workflow_state=published^${query ? `(short_descriptionLIKE${query}^ORtextLIKE${query})` : ''}`,
          sysparm_limit: 5,
          sysparm_fields: 'short_description,number,topic,text,url',
          sysparm_display_value: true
        }
      });
      
      return response.data.result.map(article => ({
        short_description: article.short_description,
        number: article.number,
        topic: article.topic,
        text: article.text,
        url: article.url
      }));
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw error;
    }
  };

  // Fonction pour rechercher les spécifications techniques
  const searchSpecifications = async (query = '') => {
    try {
      const response = await axios.get(SN_CONFIG.endpoints.searchSpecs, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth,
        params: {
          sysparm_query: `status=published^${query ? `(nameLIKE${query}^ORshort_descriptionLIKE${query})` : ''}`,
          sysparm_limit: 10,
          sysparm_fields: 'name,number,category,type,status,sys_id,short_description'
        }
      });
      
      return response.data.result;
    } catch (error) {
      console.error('Error searching specifications:', error);
      throw error;
    }
  };

  const handleSearchKB = async (query = '') => {
    try {
      const articles = await searchKnowledgeArticles(query);
      return {
        text: articles.length ? "Voici les articles correspondants :" : "Aucun article trouvé.",
        data: articles,
        intent: 'search_kb'
      };
    } catch (error) {
      return handleError("Désolé, une erreur est survenue lors de la recherche dans la base de connaissances.");
    }
  };

  const handleSearchSpecs = async (query = '') => {
    try {
      const specs = await searchSpecifications(query);
      return {
        text: specs.length ? "Voici les spécifications techniques :" : "Aucune spécification trouvée.",
        data: specs,
        intent: 'search_specs'
      };
    } catch (error) {
      return handleError("Désolé, une erreur est survenue lors de la recherche des spécifications.");
    }
  };

  const handleGreeting = () => ({
    text: "Bonjour! Comment puis-je vous aider aujourd'hui?",
    sender: 'bot',
    options: generateDefaultOptions()
  });

  const handleHelp = () => ({
    text: "Bonjour! Je suis votre assistant commercial. Je peux vous aider à trouver des produits, des devis, des prix et plus encore. Comment puis-je vous aider aujourd'hui?",
    sender: 'bot',
    options: generateDefaultOptions()
  });


  const handleError = (message) => ({
    text: message,
    sender: 'bot',
    options: ["Réessayer", "Menu principal"]
  });
const opportunityDraft = useRef({});
const productOfferingDraft = useRef({});



const handleCreateProductOffering = () => {
  if (categories.length === 0) {
    return {
      text: "Désolé, aucune catégorie disponible pour le moment. Veuillez réessayer plus tard.",
      sender: 'bot',
      options: ["Menu principal"]
    };
  }

  setCurrentStep('create_product_offering_select_category');
  productOfferingDraft.current = {};
  
  // Afficher la liste des catégories
  const formattedList = categories
    .filter(c => c.status === "published")
    .map((c, index) => `${index + 1}. ${c.name}`)
    .join('\n');
  
  return {
    text: `Parfait. Choisissez une catégorie pour votre offre produit:\n\n${formattedList}\n\n👉 Tapez le numéro correspondant.`,
    sender: 'bot',
    options: ["Annuler"]
  };
};
const url = `https://dev268291.service-now.com/api/sn_tmf_api/catalogmanagement/productOffering`;

  // Traitement des étapes
const processStepResponse = async (input) => {
  const normalizedInput = input.toLowerCase().trim();

  if (['annuler', 'menu principal'].includes(normalizedInput)) {
    setCurrentStep(null);
    addBotMessage("✅ Opération annulée. Voici le menu principal :", generateDefaultOptions());
    return;
  }

  switch (currentStep) {
    case 'quote_product_selection':
      await processQuoteProductSelection(input);
      break;

    case 'spec_input':
      await processSpecInput(input);
      break;

    case 'knowledge_query':
      await processKnowledgeQuery(input);
      break;
    case 'create_product_offering_select_category':
      try {
        const res = await axios.get(`${backendUrl}/api/product-offering-category`, getAuthHeaders());

        if (!res.data || !res.data.data || !Array.isArray(res.data.data)) {
          throw new Error("Structure de données invalide");
        }

        const publishedCategories = res.data.data.filter(c => c.status === "published");

        if (!publishedCategories.length) {
          addBotMessage("⚠️ Aucune catégorie publiée trouvée.");
          setCurrentStep(null);
          return;
        }

        sessionStorage.setItem('po_categories', JSON.stringify(publishedCategories));
        const formattedList = publishedCategories.map((c, index) => `${index + 1}. ${c.name}`).join('\n');
        setCurrentStep('create_product_offering_select_category_choice');
        addBotMessage(`📂 Choisissez une catégorie pour l'offre :\n\n${formattedList}\n\n👉 Tapez le numéro correspondant.`);
      } catch (e) {
        console.error("Erreur de chargement des catégories :", e);
        addBotMessage("❌ Erreur lors du chargement des catégories. Veuillez réessayer plus tard.");
        setCurrentStep(null);
      }
      break;

    case 'create_product_offering_select_category_choice':
      const categories = JSON.parse(sessionStorage.getItem('po_categories') || '[]');
      const choice = parseInt(input);

      if (isNaN(choice) || choice < 1 || choice > categories.length) {
        addBotMessage("⚠️ Choix invalide. Veuillez entrer un numéro de la liste.");
        return;
      }

      const selectedCategory = categories[choice - 1];
      productOfferingDraft.current.category = {
        _id: selectedCategory._id,
        id: selectedCategory.id || selectedCategory._id,
        name: selectedCategory.name,
        status: selectedCategory.status
      };

      setCurrentStep('create_product_offering_step1');
      addBotMessage("📝 Entrez le **nom** de l'offre produit.");
      break;

    case 'create_product_offering_step1':
      if (!input.trim()) {
        addBotMessage("⚠️ Le nom ne peut pas être vide.");
        return;
      }
      productOfferingDraft.current.name = input.trim();
      setCurrentStep('create_product_offering_step2');
      addBotMessage("✏️ Entrez une **description** pour cette offre.");
      break;

    case 'create_product_offering_step2':
      productOfferingDraft.current.description = input.trim();
      setCurrentStep('create_product_offering_step3');
      addBotMessage("💰 Quel est le **prix mensuel** (récurrent) en USD ?");
      break;

    case 'create_product_offering_step3':
      const recurring = parseFloat(input);
      if (isNaN(recurring)) {
        addBotMessage("⚠️ Veuillez entrer un prix mensuel valide.");
        return;
      }
      productOfferingDraft.current.recurring_price = recurring;
      setCurrentStep('create_product_offering_step4');
      addBotMessage("💵 Quel est le **prix initial** (non récurrent) en USD ?");
      break;

    case 'create_product_offering_step4':
      productOfferingDraft.current.non_recurring_price = parseFloat(input) || 0;

      try {
      const DEFAULT_SPEC = {
        id: "0a7c94b9c331ea10db6d9a2ed40131e9",
        name: "Fiber Optic first gen",
        version: "",
        internalVersion: "1",
        internalId: "0a7c94b9c331ea10db6d9a2ed40131e9"
      }

       const payload = {
  name: productOfferingDraft.current.name || "Default Offer Name",
  description: productOfferingDraft.current.description || "Default description",
  version: "1",
  internalVersion: "1",
  lastUpdate: new Date().toISOString(),

  validFor: {
    startDateTime: new Date().toISOString(),
    endDateTime: null
  },

  productOfferingTerm: [{
    name: "12_months",
    duration: {
      amount: 12,
      units: "month"
    }
  }],

  productOfferingPrice: [
    {
      priceType: "recurring",
      price: {
        taxIncludedAmount: {
          unit: "USD",
          value: parseFloat(productOfferingDraft.current.recurring_price || "0")
        }
      }
    },
    {
      priceType: "nonRecurring",
      price: {
        taxIncludedAmount: {
          unit: "USD",
          value: parseFloat(productOfferingDraft.current.non_recurring_price || "0")
        }
      }
    }
  ],

  productSpecification: {
    id: "0a7c94b9c331ea10db6d9a2ed40131e9",
    name: "Fiber Optic first gen",
    version: "",
    internalVersion: "1",
    internalId: "0a7c94b9c331ea10db6d9a2ed40131e9"
  },

  channel: [
    {
      id: "e561aae4c3e710105252716b7d40dd8f",
      name: "Web",
      description: "",
      _id: "683830e4d1c84d9270055da3"
    }
  ],

 category: [],
  
  catalog: {
    id: "b7c9f21dc3752a10db6d9a2ed40131b7",
    name: "Internet Catalog", // Nom plus cohérent
    href: "/api/sn_tmf_api/catalogmanagement/catalog/b7c9f21dc3752a10db6d9a2ed40131b7"
  },

  lifecycleStatus: "Active",
  status: "published"

    // Ajout du catalogue obligatoire
    
  };
  
         console.log("Payload envoyé:", JSON.stringify(payload, null, 2));

    const res = await axios.post(
      url,
      JSON.stringify(payload), // Sérialisation explicite
      {
        headers: {
          'Authorization': 'Basic ' + btoa('group2:K5F/Uj/lDbo9YAS'),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    addBotMessage(`✅ Offre créée avec succès ! ID: ${res.data.id}`);
  } catch (e) {
    console.error("Erreur détaillée:", {
      request: e.config,
      response: e.response?.data
    });
    addBotMessage("❌ Échec de la création. Vérifiez les logs pour plus de détails.");
  }
      setCurrentStep(null);
      break;

    default:
      addBotMessage("❓ Je ne comprends pas cette étape.");
      break;
  }
};



  // Fonctions de traitement des étapes
  const processQuoteProductSelection = async (productName) => {
    try {
      // Trouver le produit correspondant
      const productsResponse = await axios.get(`${backendUrl}/api/product-offering-catalog-publish`, getAuthHeaders());
      const product = productsResponse.data.find(p => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      );

      if (!product) {
        addBotMessage(`Aucun produit trouvé avec le nom "${productName}". Voulez-vous réessayer?`, [
          "Oui, réessayer",
          "Non, merci"
        ]);
        return;
      }

      // Créer le devis
      const quoteResponse = await axios.post(
        `${backendUrl}/api/quote`,
        {
          productId: product.id,
          productName: product.name
        },
        getAuthHeaders()
      );

      setCurrentStep(null);
      addBotMessage(`Devis créé pour le produit ${product.name}. Numéro de devis: ${quoteResponse.data.quoteNumber}. Que souhaitez-vous faire maintenant?`, [
        "Voir d'autres produits",
        "Voir les prix",
        "Menu principal"
      ]);
    } catch (error) {
      addBotMessage("Désolé, une erreur est survenue lors de la création du devis.");
    }
  };

  const processSpecInput = async (spec) => {
    try {
      // Rechercher les produits correspondant à la spécification
      const response = await axios.get(`${backendUrl}/api/product-offering-catalog-publish?spec=${encodeURIComponent(spec)}`, getAuthHeaders());
      setCurrentStep(null);
      if (response.data.length > 0) {
        addBotMessage(`Voici les produits correspondant à la spécification "${spec}":`);
        setMessages(prev => [
          ...prev,
          {
            text: '',
            sender: 'bot',
            data: response.data,
            intent: 'search_products'
          }
        ]);
      } else {
        addBotMessage(`Aucun produit trouvé pour la spécification "${spec}". Voulez-vous essayer avec une autre spécification?`, [
          "Oui, chercher à nouveau",
          "Non, merci"
        ]);
      }
    } catch (error) {
      addBotMessage("Désolé, une erreur est survenue lors de la recherche.");
    }
  };

  const processKnowledgeQuery = async (query) => {
    try {
      const response = await handleSearchKB(query);
      setCurrentStep(null);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      addBotMessage("Désolé, une erreur est survenue lors de la recherche.");
    }
  };

  // Fonctions utilitaires
  const addBotMessage = (text, options = [], data = null) => {
    const newMessage = { text, sender: 'bot', options };
    if (data) {
      newMessage.data = Array.isArray(data) ? data : [data];
    }
    setMessages(prev => [...prev, newMessage]);
  };

const generateDefaultOptions = () => {
  return [
    "Rechercher produits",
    "Demander un devis",
    "Voir les prix",
    "Liste des catégories",
    "Voir mes devis",
    "Lister les spécifications",
    "Base de connaissances",
    "Créer une offre produit",

        "Aide"
  ];
};

  const getFollowUpOptions = (intent) => {
    switch(intent) {
      case 'search_products':
        return ["Filtrer par catégorie", "Demander un devis", "Menu principal"];
      case 'request_quote':
        return ["Créer un autre devis", "Voir les produits", "Menu principal"];
      case 'check_price':
        return ["Voir les produits", "Demander un devis", "Menu principal"];
      case 'check_opportunity':
        return ["Voir plus d'opportunités", "Menu principal"];
      case 'get_channel_info':
        return ["Voir les produits", "Menu principal"];
      case 'search_products_by_spec':
        return ["Rechercher une autre spécification", "Voir toutes les spécifications", "Menu principal"];
      case 'list_categories':
        return ["Voir produits par catégorie", "Menu principal"];
      case 'search_kb':
        return ["Chercher un autre article", "Menu principal"];
      case 'search_specs':
        return ["Rechercher produits par spécification", "Menu principal"];
      default:
        return generateDefaultOptions();
    }
  };

  const handleQuickOption = (option) => {
    if (option === "Aide") {
      setShowHelp(true);
      return;
    }
    
    setInput(option);
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      initializeChat();
    }
  };

  // Formatage des données
  const formatProducts = (products) => {
    if (!products?.length) {
      return <div className="no-data">Aucun produit trouvé</div>;
    }
  
    return (
      <div className="products-grid">
        {products.map(product => (
          <div key={product._id || product.id} className="product-card"> 
            <h4>{product.name}</h4>
            <div className="product-details">
              {product.description && <p>{product.description}</p>}
              {product.number && <div>Numéro: {product.number}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatCategories = (categories) => {
  if (!categories?.length) {
    return <div className="no-data">Aucune catégorie disponible</div>;
  }

  return (
    <div className="categories-list">
      <ul>
        {categories.map((category, index) => (
          <li key={category._id || index}>
            <button 
              onClick={() => {
                setInput(`Créer une offre produit dans la catégorie ${category.name}`);
                setTimeout(() => handleSendMessage(), 300);
              }}
              className="category-button"
            >
              {category.name} {category.productCount ? `(${category.productCount})` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

  const formatQuotes = (quotes) => {
    if (!quotes?.length) {
      return <div className="no-data">Aucun devis trouvé</div>;
    }
  
    return (
      <div className="quotes-list">
        {quotes.map((quote) => (
          <div key={quote._id} className="quote-card">
            <h4>Devis #{quote.number}</h4>
            <div className="quote-details">
              <div>Description : {quote.short_description || 'N/A'}</div>
              <div>Statut : {quote.state}</div>
              <div>Devise : {quote.currency}</div>
              <div>Expiration : {quote.expiration_date}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatPrices = (prices) => {
    if (!prices?.length) {
      return <div className="no-data">Aucun prix disponible</div>;
    }
  
    return (
      <div className="prices-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Devise</th>
              <th>Date début</th>
              <th>Date fin</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((price) => (
              <tr key={price._id}>
                <td>{price.name}</td>
                <td>{price.currency}</td>
                <td>{price.start_date}</td>
                <td>{price.end_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  

  const formatOpportunities = (opportunities) => {
    if (!opportunities?.length) {
      return <div className="no-data">Aucune opportunité disponible</div>;
    }

    return (
      <div className="opportunities-grid">
        {opportunities.map(opp => (
          <div key={opp.id} className="opportunity-card">
            <h4>{opp.name}</h4>
            <div className="opportunity-details">
              <div>Client: {opp.customer}</div>
              <div>Montant: {opp.amount} €</div>
              <div>Probabilité: {opp.probability}%</div>
              <div>Échéance: {opp.dueDate}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatChannels = (channels) => {
    if (!channels?.length) {
      return <div className="no-data">Aucun canal disponible</div>;
    }

    return (
      <div className="channels-list">
        {channels.map(channel => (
          <div key={channel.id} className="channel-card">
            <h4>{channel.name}</h4>
            <div className="channel-details">
              <div>Type: {channel.type}</div>
              <div>Contact: {channel.contact}</div>
              <div>Disponibilité: {channel.availability}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatSpecs = (specs) => {
    if (!specs?.length) {
      return <div className="no-data">Aucune spécification disponible</div>;
    }

    return (
      <div className="specs-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Numéro</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {specs.map(spec => (
              <tr key={spec.sys_id}>
                <td>{spec.name}</td>
                <td>{spec.number}</td>
                <td>{spec.category || 'N/A'}</td>
                <td>{spec.type || 'N/A'}</td>
                <td>{spec.short_description || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatArticles = (articles) => {
    if (!articles?.length) {
      return <div className="no-data">Aucun article trouvé.</div>;
    }

    return (
      <div className="articles-grid">
        {articles.map((article, index) => (
          <div key={index} className="article-card">
            <h4>{article.short_description}</h4>
            <table>
              <tbody>
                <tr>
                  <td>Numéro :</td>
                  <td>{article.number}</td>
                </tr>
                {article.topic && (
                  <tr>
                    <td>Sujet :</td>
                    <td>{article.topic}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {article.text && (
              <div className="article-text" dangerouslySetInnerHTML={{ __html: article.text }} />
            )}
            {article.url && (
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Voir l'article complet
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

// Composant Popup d'aide 
const HelpPopup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const categories = [
    {
      id: 'products',
      title: 'Produits & Offres',
      icon: '📦',
      description: 'Recherche et gestion des produits et offres commerciales'
    },
    {
      id: 'quotes',
      title: 'Devis & Tarifs',
      icon: '💰',
      description: 'Création et modification de devis, consultation des prix'
    },
    {
      id: 'sales',
      title: 'Opportunités',
      icon: '📈',
      description: 'Gestion du pipeline commercial et des opportunités'
    },
    {
      id: 'servicenow',
      title: 'ServiceNow',
      icon: '🛠️',
      description: 'Modules, certifications et fonctionnalités techniques'
    },
    {
      id: 'admin',
      title: 'Administration',
      icon: '🔧',
      description: 'Gestion des utilisateurs et configuration système'
    },
    {
      id: 'kb',
      title: 'Base de connaissances',
      icon: '📚',
      description: 'Documentation et ressources d\'aide'
    }
  ];

  const filters = [
    { id: 'all', label: 'Tout voir' },
    { id: 'products', label: 'Produits' },
    { id: 'quotes', label: 'Devis' },
    { id: 'sales', label: 'Ventes' },
    { id: 'technical', label: 'Technique' }
  ];


  const allExamples = [
    { text: "Je veux voir les produits disponibles", category: 'products' },
    { text: "Créez un devis pour le produit X", category: 'quotes' },
    { text: "Quels sont les prix pour les produits Y ?", category: 'quotes' },
    { text: "Quelles sont les opportunités en cours ?", category: 'sales' },
    { text: "Rechercher des produits avec la spécification Z", category: 'products' },
    { text: "Rechercher dans la base de connaissances", category: 'kb' },
    { text: "Lister les spécifications techniques", category: 'products' },
    { text: "Parle-moi de FSM", category: 'servicenow' },
    { text: "C'est quoi OMT ?", category: 'servicenow' },
    { text: "Quelles sont les certifications ServiceNow ?", category: 'servicenow' },
    { text: "Créer une offre produit", category: 'products' },
    { text: "Modifier un devis", category: 'quotes' },
    { text: "Configurer une intégration SAP", category: 'servicenow' },
    { text: "Créer une opportunité de vente", category: 'sales' },
    { text: "Gérer les utilisateurs", category: 'admin' },
    { text: "Comment créer un rapport ?", category: 'servicenow' },
    { text: "Accéder à Now Learning", category: 'servicenow' }
  ];

  const [examples, setExamples] = useState(allExamples);

  useEffect(() => {
    let filtered = allExamples;
    
    // Appliquer le filtre
    if (activeFilter !== 'all') {
      filtered = filtered.filter(ex => ex.category === activeFilter);
    }
    
    // Appliquer la recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.text.toLowerCase().includes(term) || 
        ex.category.toLowerCase().includes(term)
      );
    }
    
    setExamples(filtered);
  }, [searchTerm, activeFilter]);

  const handleClickExample = (text) => {
    setShowHelp(false);
    setInput(text);
    setTimeout(() => handleSendMessage(), 300);
  };

  const handleCategoryClick = (categoryId) => {
    setActiveFilter(categoryId);
    setSearchTerm('');
  };

  return (
    <div className="help-popup-overlay">
      <div className="help-popup">
        <h3><span role="img" aria-label="lightbulb">💡</span> Comment utiliser le chatbot commercial</h3>
        
        {/* Barre de recherche */}
        <input
          type="text"
          className="help-search"
          placeholder="Rechercher dans l'aide..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {/* Filtres */}
        <div className="filter-tags">
          {filters.map(filter => (
            <div 
              key={filter.id}
              className={`filter-tag ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </div>
          ))}
        </div>
        
        {/* Catégories (visible seulement si pas de recherche) */}
        {!searchTerm && activeFilter === 'all' && (
          <>
            <p className="help-intro">📌 Par quoi souhaitez-vous commencer ? Choisissez une catégorie ci-dessous.</p>
            <div className="help-categories">
              {categories.map(category => (
                <div 
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <h4>
                    <span className="icon-circle">{category.icon}</span>
                    {category.title}
                  </h4>

                  <p>{category.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
        
        
        
        {/* Exemples de requêtes */}
        <p><span role="img" aria-label="examples">📌</span> Exemples de requêtes :</p>
        <ul className="help-examples">
          {examples.map((ex, i) => (
            <li key={i}>
              <button 
                className="example-btn" 
                onClick={() => handleClickExample(ex.text)}
              >
                {ex.text}
              </button>
            </li>
          ))}
        </ul>
        
        <button className="close-btn" onClick={() => setShowHelp(false)}>
          Fermer l'aide
        </button>
      </div>
    </div>
  );
};
const formatCases = (cases) => {
  if (!cases?.length) {
    return <div className="no-data">Aucun case trouvé</div>;
  }

  return (
    <div className="cases-list">
      {cases.map((cs) => (
        <div key={cs._id || cs.number} className="quote-card">
          <h4>Case #{cs.number}</h4>
          <div className="quote-details">
            <div>Description : {cs.short_description || 'N/A'}</div>
            <div>Statut : {cs.state}</div>
            <div>Assigné à : {cs.assigned_to || 'Non assigné'}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button className="chatbot-toggle" onClick={toggleChatbot}>
        <div className="chatbot-icon">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h2>Assistant Commercial</h2>
            <p>Je peux vous aider avec les produits, devis, prix et opportunités</p>
            <button className="close-button" onClick={toggleChatbot}>
              &times;
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text}
                  
                  {msg.data && (
                    <>
                      {msg.intent === 'search_products' && formatProducts(msg.data)}
                      {msg.intent === 'list_categories' && formatCategories(msg.data)}
                      {msg.intent === 'view_quotes' && formatQuotes(msg.data)}
                      {msg.intent === 'list_specs' && formatSpecs(msg.data)}
                      {msg.intent === 'check_price' && formatPrices(msg.data)}
                      {msg.intent === 'check_opportunity' && formatOpportunities(msg.data)}
                      {msg.intent === 'view_cases' && formatCases(msg.data)}
                      {msg.intent === 'get_channel_info' && formatChannels(msg.data)}
                      {msg.intent === 'search_specs' && formatSpecs(msg.data)}
                      {msg.intent === 'search_kb' && formatArticles(msg.data)}
                    </>
                  )}
                  
                  {msg.options && (
                  <div className="message-options">
                    {msg.options.map((option, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleQuickOption(option)}
                        className="option-button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="loading-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tapez votre message ici..."
              disabled={loading}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={loading || !input.trim()}
              className="send-button"
            >
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <span>Envoyer</span>
              )}
            </button>
          </div>
        </div>
      )}
      {showHelp && <HelpPopup />}
      <style jsx>{`
  /* ========== VARIABLES & FONDAMENTAUX ========== */
  :root {
    /* Couleurs */
    --primary-color: #00647a;
    --primary-dark: #00647a;
    --primary-light: #ebefff;
    --secondary-color: #00647a;
    --accent-color: #00647a;
    --success-color: #4bb543;
    --error-color: #ff3333;
    --warning-color: #ffc107;
    --light-bg: #f8f9fa;
    --dark-text: #212529;
    --light-text: #f8f9fa;
    --gray-text: #6c757d;
    --border-color: #e9ecef;
    
    /* Ombres */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.15);
    
    /* Espacements */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    
    /* Rayons de bordure */
    --radius-sm: 0.5rem;
    --radius-md: 0.75rem;
    --radius-lg: 1rem;
    --radius-xl: 1.25rem;
    --radius-full: 9999px;
    
    /* Animations */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.45s ease;
  }

  * {
    box-sizing: border-box;
  }

  /* ========== STRUCTURE PRINCIPALE ========== */
  .chatbot-container {
    position: fixed;
    bottom: var(--space-xl);
    right: var(--space-xl);
    z-index: 1000;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    font-size: 16px;
    line-height: 1.5;
  }

  /* ========== BOUTON DE BASULE ========== */
  .chatbot-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    background: var(--primary-color);
    color: var(--light-text);
    border: none;
    border-radius: var(--radius-full);
    padding: var(--space-md) var(--space-lg);
    cursor: pointer;
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-normal);
    font-weight: 600;
    font-size: 0.95rem;
    position: relative;
    overflow: hidden;
  }

  .chatbot-toggle:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }

  .chatbot-toggle::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 1%, transparent 1%) center/15000%;
    opacity: 0;
    transition: opacity 0.5s, background-size 0.5s;
  }

  .chatbot-toggle:active::after {
    background-size: 100%;
    opacity: 1;
    transition: background-size 0s;
  }

  .chatbot-icon {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }

  /* ========== FENÊTRE DU CHATBOT ========== */
  .chatbot-window {
    position: absolute;
    bottom: calc(100% + var(--space-md));
    right: 0;
    width: 28rem;
    max-height: 40rem;
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    animation: fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid var(--border-color);
    opacity: 0;
    transform: scale(0.95);
    animation-fill-mode: forwards;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* ========== EN-TÊTE ========== */
  .chatbot-header {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--light-text);
    padding: var(--space-lg);
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
    z-index: 10;
  }

  .chatbot-header h2 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .chatbot-header p {
    margin: var(--space-sm) 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
    font-weight: 400;
  }

  .close-button {
    position: absolute;
    top: var(--space-md);
    right: var(--space-md);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 1.2rem;
    line-height: 1;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg) scale(1.1);
  }

  /* ========== ZONE DE MESSAGES ========== */
  .chatbot-messages {
    flex: 1;
    padding: var(--space-lg);
    overflow-y: auto;
    background: var(--light-bg);
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  /* Custom scrollbar */
  .chatbot-messages::-webkit-scrollbar {
    width: 8px;
  }

  .chatbot-messages::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--radius-full);
  }

  .chatbot-messages::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: var(--radius-full);
  }

  .chatbot-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
  }

  /* ========== STYLES DES MESSAGES ========== */
  .message {
    max-width: 85%;
    animation: messageAppear 0.3s ease-out;
    display: flex;
    flex-direction: column;
  }

  @keyframes messageAppear {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.user {
    margin-left: auto;
    align-items: flex-end;
  }

  .message.bot {
    margin-right: auto;
    align-items: flex-start;
  }

  .message-content {
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-lg);
    line-height: 1.5;
    font-size: 0.95rem;
    position: relative;
    word-wrap: break-word;
    max-width: 100%;
    box-shadow: var(--shadow-sm);
  }

  .user .message-content {
    background: var(--primary-color);
    color: var(--light-text);
    border-bottom-right-radius: var(--space-xs);
    box-shadow: var(--shadow-sm);
  }

  .bot .message-content {
    background: white;
    color: var(--dark-text);
    border-bottom-left-radius: var(--space-xs);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
  }

  /* Bulle triangulaire pour les messages */
  .message-content::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 0;
    height: 0;
    border: 8px solid transparent;
  }

  .user .message-content::after {
    right: -8px;
    border-left-color: var(--primary-color);
    border-right: 0;
    border-bottom: 0;
  }

  .bot .message-content::after {
    left: -8px;
    border-right-color: white;
    border-left: 0;
    border-bottom: 0;
  }

  /* ========== OPTIONS DE RÉPONSE RAPIDE ========== */
  .message-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }

  .option-button {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    padding: var(--space-sm) var(--space-md);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--primary-color);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
    white-space: nowrap;
  }

  .option-button:hover {
    background: var(--primary-light);
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .option-button:active {
    transform: translateY(0);
  }

  /* ========== INDICATEUR DE CHARGEMENT ========== */
  .loading-indicator {
    display: flex;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-md);
  }

  .dot {
    width: 0.7rem;
    height: 0.7rem;
    background: var(--primary-color);
    border-radius: var(--radius-full);
    animation: bounce 1.4s infinite ease-in-out;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes bounce {
    0%, 80%, 100% { 
      transform: translateY(0);
    }  
    40% { 
      transform: translateY(-6px);
    }
  }

  /* ========== ZONE DE SAISIE ========== */
  .chatbot-input {
    display: flex;
    padding: var(--space-md);
    background: white;
    border-top: 1px solid var(--border-color);
    position: relative;
  }

  .chatbot-input::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.05), transparent);
  }

  .chatbot-input input {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    outline: none;
    transition: all var(--transition-normal);
    font-size: 0.95rem;
    min-height: 3rem;
  }

  .chatbot-input input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }

  .send-button {
    margin-left: var(--space-md);
    padding: 0 var(--space-lg);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 6rem;
    position: relative;
    overflow: hidden;
  }

  .send-button:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .send-button:disabled {
    background: var(--border-color);
    color: var(--gray-text);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .send-button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.4) 1%, transparent 1%) center/15000%;
    opacity: 0;
    transition: opacity 0.5s, background-size 0.5s;
  }

  .send-button:active::after {
    background-size: 100%;
    opacity: 1;
    transition: background-size 0s;
  }

  .spinner {
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-full);
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ========== COMPOSANTS DE DONNÉES ========== */
  /* Conteneur générique */
  .data-container {
    margin-top: var(--space-md);
    width: 100%;
  }

  /* Message quand pas de données */
  .no-data {
    text-align: center;
    color: var(--gray-text);
    font-size: 0.9rem;
    padding: var(--space-lg);
    background: white;
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
  }

  /* Grille de produits */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space-md);
    margin-top: var(--space-md);
  }

  .product-card {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
  }

  .product-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  .product-card h4 {
    margin: 0 0 var(--space-sm);
    color: var(--primary-color);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .product-details {
    font-size: 0.85rem;
    color: var(--dark-text);
    line-height: 1.5;
    margin-top: auto;
  }

  /* Listes */
  .categories-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-md);
  }

  .category-button {
    display: block;
    width: 100%;
    padding: var(--space-md);
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-normal);
    font-size: 0.9rem;
    color: var(--primary-color);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .category-button:hover {
    background: var(--primary-light);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  /* Cartes (devis, opportunités, etc.) */
  .quote-card, .opportunity-card, 
  .channel-card, .article-card {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-md);
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-sm);
  }

  .quote-card:hover, .opportunity-card:hover,
  .channel-card:hover, .article-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  .quote-card h4, .opportunity-card h4, 
  .channel-card h4, .article-card h4 {
    margin: 0 0 var(--space-sm);
    font-size: 1rem;
    color: var(--primary-color);
    font-weight: 600;
  }

  .quote-details, .opportunity-details, 
  .channel-details, .article-details {
    font-size: 0.85rem;
    color: var(--dark-text);
    line-height: 1.5;
  }

  /* Tableaux */
  .specs-table, .prices-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: var(--space-md);
    font-size: 0.85rem;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 0 0 1px var(--border-color);
  }

  .specs-table th, .specs-table td,
  .prices-table th, .prices-table td {
    padding: var(--space-md);
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .specs-table th, .prices-table th {
    background-color: var(--light-bg);
    font-weight: 600;
    color: var(--dark-text);
    position: sticky;
    top: 0;
  }

  .specs-table tr:last-child td,
  .prices-table tr:last-child td {
    border-bottom: none;
  }

  .specs-table tr:hover td,
  .prices-table tr:hover td {
    background-color: var(--primary-light);
  }

  /* ========== POPUP D'AIDE ========== */
  .help-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(5px);
    animation: fadeIn var(--transition-normal) forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .help-popup {
    background: white;
    border-radius: var(--radius-xl);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    padding: var(--space-xl);
    box-shadow: var(--shadow-xl);
    animation: popupFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid var(--border-color);
    position: relative;
  }

  @keyframes popupFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .help-popup h3 {
    margin: 0 0 var(--space-lg);
    color: var(--primary-color);
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  /* Barre de recherche */
  .help-search {
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-lg);
    font-size: 1rem;
    transition: all var(--transition-normal);
    box-shadow: var(--shadow-sm);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236c757d' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: var(--space-md) center;
    background-size: 1rem;
    padding-left: calc(var(--space-md) + 1rem + var(--space-sm));
  }

  .help-search:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }

  /* Filtres */
  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
  }

  .filter-tag {
    background: rgba(67, 97, 238, 0.1);
    color: var(--primary-color);
    border-radius: var(--radius-full);
    padding: var(--space-sm) var(--space-md);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-weight: 500;
    border: 1px solid transparent;
  }

  .filter-tag:hover, .filter-tag.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  /* Catégories */
  .help-categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.category-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid #eaeaea;
}

.category-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
  background: #fefefe;
}

.icon-circle {
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.6rem;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: background 0.3s ease, transform 0.3s ease;
}

.category-card:hover .icon-circle {
  background: var(--primary-color);
  color: #fff;
  transform: scale(1.1);
}

.category-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0.5rem 0;
}

.category-card p {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}



  .category-card:hover {
    background: var(--primary-light);
    border-color: var(--primary-color);
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
  }

  .category-card h4 {
    margin: 0 0 var(--space-sm);
    color: var(--primary-color);
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  .category-card p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--dark-text);
    line-height: 1.5;
  }

  /* Exemples de requêtes */
  .help-examples {
    list-style: none;
    padding: 0;
    margin: var(--space-lg) 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-md);
  }

  .example-btn {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all var(--transition-fast);
    color: var(--dark-text);
    text-align: left;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
    width: 100%;
  }

  .example-btn:hover {
    background: var(--primary-light);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    color: var(--primary-color);
  }

  /* Bouton de fermeture */
  .close-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-md) var(--space-lg);
    font-size: 1rem;
    cursor: pointer;
    transition: all var(--transition-normal);
    margin-top: var(--space-xl);
    width: 100%;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }

  .close-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .close-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 1%, transparent 1%) center/15000%;
    opacity: 0;
    transition: opacity 0.5s, background-size 0.5s;
  }

  .close-btn:active::after {
    background-size: 100%;
    opacity: 1;
    transition: background-size 0s;
  }

  /* ========== RESPONSIVE ========== */
  @media (max-width: 768px) {
    .chatbot-container {
      bottom: var(--space-md);
      right: var(--space-md);
    }
    
    .chatbot-window {
      width: 95vw;
      max-height: 80vh;
      bottom: calc(100% + var(--space-sm));
    }
    
    .help-popup {
      width: 95vw;
      padding: var(--space-lg);
    }

    .help-categories {
      grid-template-columns: 1fr;
    }

    .products-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .chatbot-toggle span {
      display: none;
    }
    
    .chatbot-toggle {
      padding: var(--space-md);
      border-radius: var(--radius-full);
    }
    
    .message-options {
      flex-direction: column;
    }
    
    .option-button {
      width: 100%;
    }
  }
    .help-categories .icon-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  margin-right: 0.5rem;
}

.help-intro {
  font-size: 1rem;
  font-weight: 500;
  color: var(--primary-color);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


`}</style>
    </div> // ← fermeture correcte du return principal du composant
  );
};
export default Chatbot;