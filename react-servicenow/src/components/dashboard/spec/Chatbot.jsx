import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Bonjour! Je suis votre assistant ServiceNow. Comment puis-je vous aider aujourd'hui?",
      sender: 'bot',
      options: [
        "Lister les spécifications produits",
        "Rechercher un article de connaissance",
        "Voir les offres produits",
        "Aide sur OMT",
        "Créer un ticket"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const messagesEndRef = useRef(null);

  // Configuration ServiceNow
  const SN_CONFIG = {
    baseURL: 'https://dev323456.service-now.com',
    auth: {
      username: 'admin',
      password: 'bz!T-1ThIc1L'
    },
    endpoints: {
      searchSpecs: '/api/now/table/sn_prd_pm_product_specification',
      searchKB: '/api/now/table/kb_knowledge',
      searchProducts: '/api/now/table/cmdb_ci_product',
      createIncident: '/api/now/table/incident'
    }
  };

  // Articles par défaut pour requêtes spéciales
  const DEFAULT_ARTICLES = {
    "omt": {
      name: "Guide complet OMT (Order Management Template)",
      number: "KB0012345",
      topic: "Order Management",
      text: "L'OMT est un template standard pour la gestion des commandes dans ServiceNow. Il inclut des workflows prédéfinis et des bonnes pratiques pour le processus de commande."
    },
    "produit": {
      name: "Catalogue des produits disponibles",
      number: "KB0023456",
      topic: "Produits",
      text: "Notre catalogue contient tous les produits disponibles avec leurs spécifications techniques. Consultez la liste complète dans la section Produits."
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setMessages([{
        text: "Bonjour! Je suis votre assistant ServiceNow. Comment puis-je vous aider aujourd'hui?",
        sender: 'bot',
        options: [
          "Lister les spécifications produits",
          "Rechercher un article de connaissance",
          "Voir les offres produits",
          "Aide sur OMT",
          "Créer un ticket"
        ]
      }]);
    }
  };

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
      addBotMessage("Désolé, je n'ai pas compris. Pouvez-vous reformuler votre demande?");
    } finally {
      setLoading(false);
    }
  };

  const processUserInput = async (userInput) => {
    const intent = detectIntent(userInput);
    let response;

    switch (intent) {
      case 'search_specs':
        const specs = await searchSpecifications();
        response = {
          text: specs.length ? "Voici les spécifications disponibles:" : "Aucune spécification trouvée.",
          data: specs,
          intent: 'search_specs'
        };
        break;

      case 'search_kb':
        setCurrentStep('knowledge_query');
        return {
          text: "Sur quel sujet souhaitez-vous chercher dans la base de connaissances?",
          sender: 'bot',
          intent: 'search_kb'
        };

      case 'search_products':
        const products = await searchProducts();
        response = {
          text: products.length ? "Voici nos offres produits disponibles:" : "Aucun produit trouvé.",
          data: products,
          intent: 'search_products'
        };
        break;

      case 'omt_help':
        // Vérifie d'abord si on a un article par défaut
        if (DEFAULT_ARTICLES.omt) {
          response = {
            text: "Voici des informations sur OMT (Order Management Template):",
            data: [DEFAULT_ARTICLES.omt],
            intent: 'omt_help'
          };
        } else {
          const omtArticles = await searchKnowledgeArticles("OMT");
          response = {
            text: omtArticles.length ? "Voici des articles sur OMT:" : "Aucun article trouvé sur OMT.",
            data: omtArticles,
            intent: 'omt_help'
          };
        }
        break;

      case 'create_ticket':
        setCurrentStep('ticket_short_description');
        return {
          text: "Je vais vous aider à créer un ticket. Quel est le résumé du problème?",
          sender: 'bot',
          intent: 'create_ticket'
        };

      case 'greeting':
        return {
          text: "Bonjour! Comment puis-je vous aider aujourd'hui?",
          sender: 'bot',
          options: [
            "Lister les spécifications produits",
            "Rechercher un article de connaissance",
            "Voir les offres produits",
            "Aide sur OMT",
            "Créer un ticket"
          ]
        };

      case 'help':
      default:
        return {
          text: "Je peux vous aider avec:",
          sender: 'bot',
          options: [
            "Lister les spécifications produits",
            "Rechercher un article de connaissance",
            "Voir les offres produits",
            "Aide sur OMT",
            "Créer un ticket"
          ]
        };
    }

    return response;
  };

  const processStepResponse = async (input) => {
    // Recherche dans la base de connaissances
    if (currentStep === 'knowledge_query') {
      // Vérifie d'abord les requêtes spéciales
      if (input.toLowerCase().includes("omt")) {
        setCurrentStep(null);
        addBotMessage("Voici des informations sur OMT:", [], DEFAULT_ARTICLES.omt);
        return;
      }

      if (input.toLowerCase().includes("produit")) {
        setCurrentStep(null);
        addBotMessage("Voici des informations sur nos produits:", [], [DEFAULT_ARTICLES.produit]);
        return;
      }

      const articles = await searchKnowledgeArticles(input);
      setCurrentStep(null);

      if (articles.length > 0) {
        addBotMessage(`Voici les articles trouvés pour "${input}":`);
        setMessages(prev => [
          ...prev,
          {
            text: '',
            sender: 'bot',
            data: articles,
            intent: 'search_kb'
          }
        ]);
      } else {
        addBotMessage(`Aucun article trouvé pour "${input}". Voulez-vous essayer avec d'autres mots-clés?`, [
          "Oui, chercher à nouveau",
          "Non, merci"
        ]);
      }
      return;
    }

    // Création de ticket
    if (currentStep === 'ticket_short_description') {
      setContext({ ticket: { short_description: input } });
      setCurrentStep('ticket_priority');
      addBotMessage("Merci. Quelle est la priorité de ce ticket?", [
        "1 - Critique",
        "2 - Élevée",
        "3 - Moyenne",
        "4 - Faible"
      ]);
      return;
    }

    if (currentStep === 'ticket_priority') {
      const priorityMap = {
        "1": "1",
        "critique": "1",
        "2": "2",
        "élevée": "2",
        "3": "3",
        "moyenne": "3",
        "4": "4",
        "faible": "4"
      };

      const priority = priorityMap[input.toLowerCase().split(" - ")[0]];

      if (!priority) {
        addBotMessage("Priorité non reconnue. Veuillez choisir une priorité entre 1 (Critique) et 4 (Faible).", [
          "1 - Critique",
          "2 - Élevée",
          "3 - Moyenne",
          "4 - Faible"
        ]);
        return;
      }

      setContext(prev => ({
        ticket: {
          ...prev.ticket,
          priority
        }
      }));

      setCurrentStep('ticket_description');
      addBotMessage("Merci. Pouvez-vous décrire le problème plus en détail?");
      return;
    }

    if (currentStep === 'ticket_description') {
      const ticketData = {
        ...context.ticket,
        description: input,
        caller_id: "user", // À remplacer par l'utilisateur réel
        category: "inquiry"
      };

      try {
        const ticket = await createIncident(ticketData);
        setCurrentStep(null);
        setContext(null);

        addBotMessage(`Ticket créé avec succès! Numéro: ${ticket.number}. Que souhaitez-vous faire maintenant?`, [
          "Voir le statut du ticket",
          "Rechercher un article de connaissance",
          "Retour au menu principal"
        ]);
      } catch (error) {
        addBotMessage("Désolé, je n'ai pas pu créer le ticket. Veuillez réessayer ou contacter l'administrateur.");
        console.error("Erreur création ticket:", error);
      }
      return;
    }

    addBotMessage("Je n'ai pas compris. Pouvez-vous répéter?");
  };

  // Détection d'intention améliorée avec tolérance aux fautes
  const detectIntent = (text) => {
    text = text.toLowerCase().trim();

    // Salutations
    if (/(bonjour|salut|coucou|hello|hi)/.test(text)) {
      return 'greeting';
    }

    // Recherche article de connaissance (KB)
    if (
      /^rechercher un article( de connaissance)?$/.test(text) ||
      /(article de connaissance|base de connaissance|faq|kb|question|solution|problème|connaissance)/.test(text)
    ) {
      return 'search_kb';
    }

    // Aide spécifique OMT
    if (/(omt|order management|template|commande)/.test(text)) {
      return 'omt_help';
    }

    // Lister ou afficher les spécifications produits
    if (
      /^lister les spécifications( produits)?$/.test(text) ||
      /(spécification|fiche produit|fiche technique|specification)/.test(text)
    ) {
      return 'search_specs';
    }

    // Produits et offres
    if (/(produit|offre|service|forfait|abonnement)/.test(text)) {
      return 'search_products';
    }

    // Création de ticket
    if (/(ticket|incident|bug|erreur|souci|demande d'assistance|demande)/.test(text)) {
      return 'create_ticket';
    }

    // Par défaut
    return 'help';
  };


  // Fonctions ServiceNow
  const searchSpecifications = async (query = '') => {
    try {
      const params = {
        sysparm_limit: 10,
        sysparm_query: 'status=published',
        sysparm_fields: 'name,number,category,type,status,sys_id,short_description'
      };

      if (query) {
        params.sysparm_query = `status=published^nameLIKE${query}^ORdescriptionLIKE${query}`;
      }

      const response = await axios.get(SN_CONFIG.endpoints.searchSpecs, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth,
        params
      });

      return response.data.result;
    } catch (error) {
      console.error("Erreur recherche specs:", error);
      throw new Error("Impossible de récupérer les spécifications.");
    }
  };

  const searchKnowledgeArticles = async (query = '') => {
    try {
      const response = await axios.get(
        'https://dev268291.service-now.com/api/now/table/kb_knowledge',
        {
          auth: {
            username: 'group2',
            password: 'K5F/Uj/lDbo9YAS'
          },
          headers: {
            Accept: 'application/json'
          },
          params: {
            sysparm_query: `workflow=published^short_descriptionLIKE${query}^ORtextLIKE${query}`,
            sysparm_limit: 5,
            sysparm_fields: 'short_description,display_number,topic,text,url',
            sysparm_display_value: true,
            sysparm_exclude_reference_link: true
          }
        }
      );

      return response.data.result.map(article => ({
        short_description: article.short_description,
        number: article.display_number,
        topic: article.topic,
        text: article.text,
        url: article.url
      }));
    } catch (error) {
      console.error("Erreur recherche KB:", error);
      throw new Error("Impossible de récupérer les articles de connaissance.");
    }
  };

  const searchProducts = async () => {
    try {
      const response = await axios.get(SN_CONFIG.endpoints.searchProducts, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth,
        params: {
          sysparm_limit: 10,
          sysparm_query: 'install_status=1', // 1 = Installé
          sysparm_fields: 'name,model_number,version,sys_id,short_description'
        }
      });

      return response.data.result;
    } catch (error) {
      console.error("Erreur recherche produits:", error);
      throw new Error("Impossible de récupérer les produits.");
    }
  };

  const createIncident = async (ticketData) => {
    try {
      const response = await axios.post(SN_CONFIG.endpoints.createIncident, ticketData, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth
      });

      return response.data.result;
    } catch (error) {
      console.error("Erreur création incident:", error);
      throw new Error("Impossible de créer le ticket.");
    }
  };

  // Formatage des données
  const formatSpecifications = (specs) => {
    if (!specs || !Array.isArray(specs)) {
      return <div className="p-4 text-center italic text-gray-500 bg-gray-50 rounded-lg my-2.5">Aucune donnée disponible</div>;
    }

    return (
      <div className="w-full overflow-x-auto my-3 text-sm rounded-lg shadow-sm">
        <table className="w-full border-collapse border-spacing-0 min-w-[420px]">
          <thead>
            <tr>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Nom</th>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Numéro</th>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Catégorie</th>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Type</th>
            </tr>
          </thead>
          <tbody>
            {specs.map(spec => (
              <tr key={spec.sys_id} className="hover:bg-blue-50">
                <td className="p-2 border-b border-gray-100 align-top">{spec.name}</td>
                <td className="font-mono text-sm p-2 border-b border-gray-100 align-top">{spec.number}</td>
                <td className="p-2 border-b border-gray-100 align-top">{spec.category || 'N/A'}</td>
                <td className="p-2 border-b border-gray-100 align-top">{spec.type || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatArticles = (articles) => {
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return (
        <div className="p-4 text-center italic text-gray-500 bg-gray-50 rounded-lg my-2.5">
          Aucun article trouvé.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 mt-3">
        {articles.map((article, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-sm"
          >
            <h4 className="font-semibold text-blue-700 mb-2">{article.short_description}</h4>
            <table className="table-auto text-left w-full text-gray-700 text-sm">
              <tbody>
                {article.number && (
                  <tr>
                    <td className="font-medium pr-2 py-1">Numéro :</td>
                    <td>{article.number}</td>
                  </tr>
                )}
                {article.topic && (
                  <tr>
                    <td className="font-medium pr-2 py-1">Sujet :</td>
                    <td>{article.topic}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {article.text && (
              <div className="mt-2 text-gray-800 leading-6">
                <hr className="my-2" />
                <div dangerouslySetInnerHTML={{ __html: article.text }} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  const formatProducts = (products) => {
    if (!products || !Array.isArray(products)) {
      return <div className="p-4 text-center italic text-gray-500 bg-gray-50 rounded-lg my-2.5">Aucun produit trouvé</div>;
    }

    return (
      <div className="grid grid-cols-1 gap-3 mt-3">
        {products.map(product => (
          <div key={product.sys_id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-700 m-0">{product.name}</h4>
            <div className="text-gray-600 text-sm mt-1">
              {product.model_number && <div>Modèle: {product.model_number}</div>}
              {product.version && <div>Version: {product.version}</div>}
            </div>
            {product.short_description && (
              <p className="text-gray-700 mt-2 text-sm">{product.short_description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Fonctions utilitaires
  const addBotMessage = (text, options = [], data = null) => {
    const newMessage = { text, sender: 'bot', options };
    if (data) {
      newMessage.data = Array.isArray(data) ? data : [data];
      newMessage.intent = 'search_kb';
    }
    setMessages(prev => [...prev, newMessage]);
  };

  const getFollowUpOptions = (intent) => {
    switch (intent) {
      case 'search_specs':
        return ["Filtrer les résultats", "Voir les produits", "Menu principal"];
      case 'search_kb':
        return ["Chercher un autre article", "Créer un ticket", "Menu principal"];
      case 'search_products':
        return ["Voir les spécifications", "Chercher un article", "Menu principal"];
      case 'omt_help':
        return ["Voir plus d'articles", "Créer un ticket OMT", "Menu principal"];
      case 'create_ticket':
        return ["Voir mes tickets", "Chercher un article", "Menu principal"];
      default:
        return [
          "Lister les spécifications produits",
          "Rechercher un article de connaissance",
          "Voir les offres produits",
          "Aide sur OMT",
          "Créer un ticket"
        ];
    }
  };

  const handleQuickOption = (option) => {
    setInput(option);
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[1000] transition-all duration-300 ease-in-out ${isOpen ? 'open' : ''}`}>
      {/* <button 
        className="flex items-center bg-cyan-700 text-white border-none rounded-[50px] py-3.5 px-6 cursor-pointer shadow-md transition-all duration-300 ease-in-out font-medium hover:bg-cyan-600 hover:scale-105"
        onClick={toggleChatbot}
      >
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        
      </button> */}


      <button
        class="group relative flex justify-center items-center text-white text-sm font-bold "
        onClick={toggleChatbot}
      >


        <div
          class="shadow-md flex items-center group-hover:gap-2 bg-cyan-700 group-hover:bg-cyan-600 p-3 transition-all cursor-pointer duration-300"
        >
          <svg
            fill="none"
            viewBox="0 0 24 24"
            height="25px"
            width="25px"
            xmlns="http://www.w3.org/2000/svg"
            class="fill-white"
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg >
          <span class="text-[0px]  group-hover:text-sm duration-300"
          >Assistant ServiceNow</span>
        </div>
      </button>


      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[550px] h-[500px] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden origin-bottom-right animate-fadeIn">
          <div className="bg-blue-600 text-white p-4 relative">
            <h2 className="m-0 text-xl font-semibold">Assistant ServiceNow</h2>
            <p className="mt-2 mb-0 text-sm opacity-90">Je peux vous aider avec les produits, KB et tickets</p>
            <button
              className="absolute top-3.5 right-3.5 bg-transparent border-none text-white text-2xl cursor-pointer p-1 transition-transform duration-200 hover:scale-110"
              onClick={toggleChatbot}
            >
              &times;
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 max-w-[85%] animate-messageAppear ${msg.sender === 'user' ? 'ml-auto' : 'mr-auto'
                  }`}
              >
                <div className={`px-4 py-3 rounded-2xl leading-6 text-sm shadow-sm ${msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}>
                  {msg.text}

                  {msg.data && (
                    <>
                      {msg.intent === 'search_kb' && formatArticles(msg.data)}
                      {msg.intent === 'search_specs' && formatSpecifications(msg.data)}
                      {msg.intent === 'search_products' && formatProducts(msg.data)}
                      {msg.intent === 'omt_help' && formatArticles(msg.data)}
                    </>
                  )}

                  {msg.options && (
                    <div className="flex flex-wrap gap-2.5 mt-3">
                      {msg.options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickOption(option)}
                          className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl px-3.5 py-2 text-sm cursor-pointer transition-all duration-200 hover:bg-blue-100 hover:-translate-y-px whitespace-nowrap"
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
              <div className="mr-auto max-w-[85%]">
                <div className="flex px-4 py-3">
                  <span className="h-2 w-2 bg-gray-600 rounded-full inline-block mx-1 animate-bounce"></span>
                  <span className="h-2 w-2 bg-gray-600 rounded-full inline-block mx-1 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="h-2 w-2 bg-gray-600 rounded-full inline-block mx-1 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex p-3.5 border-t border-gray-200 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tapez votre message ici..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-3xl outline-none text-sm transition-colors duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="ml-2.5 px-5 bg-blue-600 text-white border-none rounded-3xl cursor-pointer text-sm font-medium transition-colors duration-200 min-w-[80px] flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4.5 h-4.5 border-2 border-white/30 rounded-full border-t-white animate-spin mr-2"></span>
              ) : (
                <span>Envoyer</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
