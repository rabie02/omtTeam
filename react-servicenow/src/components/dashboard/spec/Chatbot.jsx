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
  const [categories, setCategories] = useState([]);
  const [loadingIntents, setLoadingIntents] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef(null);

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
        const response = await axios.get(`${backendUrl}/api/product-offering-catalog-publish/categories`, getAuthHeaders());
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

    try {
      if (currentStep) {
        await processStepResponse(input);
      } else {
        const response = await processUserInput(input);
        setMessages(prev => [...prev, response]);
        if (response.data) {
          setMessages(prev => [...prev, { 
            text: response.text || "Voici les résultats:", 
            sender: 'bot',
            isData: true,
            data: response.data,
            options: getFollowUpOptions(response.intent)
          }]);
        }
      }
    } catch (error) {
      console.error("Erreur chatbot:", error);
      addBotMessage("Désolé, une erreur est survenue. Pouvez-vous reformuler votre demande?");
    } finally {
      setLoading(false);
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
      case 'list_specs':
        return handleListAllSpecs();
      default:
        return handleHelp();
    }
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
    text: "Voici les catégories disponibles:",
    data: categories,
    intent: 'list_categories'
  });

  // Fonction pour rechercher dans la base de connaissances ServiceNow
  const searchKnowledgeArticles = async (query = '') => {
  try {
      const response = await axios.get(`${backendUrl}/api/chatbot/kb`, {
        params: { q: query },
        ...getAuthHeaders()
      });
  
      return response.data.articles;
    } catch (error) {
      console.error('❌ Erreur recherche KB:', error);
      throw new Error("Impossible de récupérer les articles de connaissance.");
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
    text: "Je peux vous aider avec:",
    sender: 'bot',
    options: generateDefaultOptions()
  });

  const handleError = (message) => ({
    text: message,
    sender: 'bot',
    options: ["Réessayer", "Menu principal"]
  });

  // Traitement des étapes
  const processStepResponse = async (input) => {
    if (input.toLowerCase() === 'annuler') {
      setCurrentStep(null);
      addBotMessage("Opération annulée. Que souhaitez-vous faire?", generateDefaultOptions());
      return;
    }

    switch(currentStep) {
      case 'quote_product_selection':
        await processQuoteProductSelection(input);
        break;
      case 'spec_input':
        await processSpecInput(input);
        break;
      case 'knowledge_query':
        await processKnowledgeQuery(input);
        break;
      default:
        addBotMessage("Je n'ai pas compris. Pouvez-vous répéter?");
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
          {categories.map(category => (
            <li key={category.id}>
              <button 
                onClick={() => {
                  setInput(`Produits dans la catégorie ${category.name}`);
                  setTimeout(() => handleSendMessage(), 300);
                }}
                className="category-button"
              >
                {category.name} ({category.productCount || 0})
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
  const HelpPopup = () => (
    <div className="help-popup-overlay">
      <div className="help-popup">
        <h3>Comment utiliser le chatbot</h3>
        <p>Notre assistant peut vous aider avec :</p>
        <ul>
          <li>Recherche de produits et offres</li>
          <li>Demande de devis</li>
          <li>Consultation des prix</li>
          <li>Gestion des opportunités</li>
          <li>Information sur les canaux</li>
          <li>Recherche par spécifications techniques</li>
          <li>Consultation de la base de connaissances</li>
        </ul>
        <p>Exemples de requêtes :</p>
        <ul>
          <li>"Je veux voir les produits disponibles"</li>
          <li>"Créez un devis pour le produit X"</li>
          <li>"Quels sont les prix pour les produits Y ?"</li>
          <li>"Quelles sont les opportunités en cours ?"</li>
          <li>"Rechercher des produits avec la spécification Z"</li>
          <li>"Rechercher dans la base de connaissances"</li>
          <li>"Lister les spécifications techniques"</li>
        </ul>
        <button onClick={() => setShowHelp(false)}>Fermer</button>
      </div>
    </div>
  );

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button className="chatbot-toggle" onClick={toggleChatbot}>
        <div className="chatbot-icon">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <span>Assistant Commercial</span>
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
        .chatbot-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
        }
        
        .chatbot-toggle {
          display: flex;
          align-items: center;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 50px;
          padding: 0.875rem 1.5rem;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .chatbot-toggle:hover {
          background: #1d4ed8;
          transform: scale(1.05);
        }
        
        .chatbot-icon {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.625rem;
        }
        
        .chatbot-window {
          position: absolute;
          bottom: 5rem;
          right: 0;
          width: 28rem;
          height: 32rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .chatbot-header {
          background: #2563eb;
          color: white;
          padding: 1rem;
          position: relative;
        }
        
        .chatbot-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .chatbot-header p {
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          opacity: 0.9;
        }
        
        .close-button {
          position: absolute;
          top: 0.875rem;
          right: 0.875rem;
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          transition: transform 0.2s;
        }
        
        .close-button:hover {
          transform: scale(1.1);
        }
        
        .chatbot-messages {
          flex: 1;
          padding: 1.25rem;
          overflow-y: auto;
          background: #f9fafb;
        }
        
        .message {
          margin-bottom: 1rem;
          max-width: 85%;
          animation: messageAppear 0.3s ease;
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
        }

        .message.bot {
          margin-right: auto;
        }

        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          line-height: 1.4;
        }

        .user .message-content {
          background: #2563eb;
          color: white;
          border-bottom-right-radius: 0.25rem;
        }

        .bot .message-content {
          background: #e5e7eb;
          color: #111827;
          border-bottom-left-radius: 0.25rem;
        }

        .message-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .option-button {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 1rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .loading-indicator {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
        }

        .dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #9ca3af;
          border-radius: 50%;
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
            transform: scale(0);
          }  
          40% { 
            transform: scale(1);
          }
        }

        .chatbot-input {
          display: flex;
          padding: 1rem;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .chatbot-input input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .chatbot-input input:focus {
          border-color: #2563eb;
        }

        .send-button {
          margin-left: 0.75rem;
          padding: 0 1.25rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover {
          background: #1d4ed8;
        }

        .send-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Styles pour les données formatées */
        .products-grid, .categories-list, .quotes-list, 
        .prices-table, .opportunities-grid, .channels-list,
        .specs-list, .articles-grid {
          margin-top: 1rem;
        }

        .product-card, .quote-card, .opportunity-card, 
        .channel-card, .article-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .product-card h4, .quote-card h4, 
        .opportunity-card h4, .channel-card h4,
        .article-card h4 {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
        }

        .product-details, .quote-details, 
        .opportunity-details, .channel-details {
          font-size: 0.8rem;
          color: #4b5563;
        }

        .specs {
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }

        .specs ul {
          padding-left: 1rem;
          margin: 0.25rem 0;
        }

        .category-button, .spec-button {
          background: none;
          border: none;
          color: #2563eb;
          text-align: left;
          padding: 0.25rem 0;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .category-button:hover, .spec-button:hover {
          text-decoration: underline;
        }

        .categories-list ul, .specs-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .categories-list li, .specs-list li {
          margin-bottom: 0.5rem;
        }

        .prices-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }

        .prices-table th, .prices-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .prices-table th {
          background: #f3f4f6;
          font-weight: 500;
        }

        .article-content {
          font-size: 0.8rem;
          line-height: 1.5;
          color: #4b5563;
          max-height: 6rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-data {
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
          padding: 1rem;
        }

        /* Styles pour le popup d'aide */
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
        }
        .help-popup {
  background: white;
  border-radius: 0.75rem;
  width: 32rem;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: popupFadeIn 0.3s ease;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.help-popup h3 {
  margin: 0 0 1rem;
  color: #1e40af;
  font-size: 1.25rem;
}

.help-popup p {
  margin: 0.75rem 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.5;
}

.help-popup ul {
  margin: 0.75rem 0;
  padding-left: 1.25rem;
}

.help-popup li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.help-popup button {
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.5rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.help-popup button:hover {
  background: #1d4ed8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chatbot-container {
    bottom: 1rem;
    right: 1rem;
  }
  
  .chatbot-window {
    width: 90vw;
    height: 70vh;
    bottom: 4.5rem;
    right: 0.5rem;
  }
  
  .help-popup {
    width: 85vw;
    padding: 1rem;
  }
    
}
 `}
      </style>
    </div> // ← fermeture correcte du return principal du composant
  );
};
export default Chatbot;
