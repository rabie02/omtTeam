import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Bonjour! Je suis votre assistant pour la gestion des spécifications produits. Comment puis-je vous aider aujourd'hui?", 
      sender: 'bot',
      options: [
        "Lister les spécifications",
        "Aide-moi à publier une spécification",
        "Rechercher un article de connaissance"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [specData, setSpecData] = useState({
    name: '',
    display_name: '',
    category: '',
    type: '',
    start_date: '',
    end_date: '',
    owner: '',
    description: '',
    status: 'draft',
    external_code: '',
    line: '',
    cost_to_company: '',
    composite: false,
    installation_required: false,
    location_specific: false
  });
  const messagesEndRef = useRef(null);

  // Configuration ServiceNow
  const SN_CONFIG = {
    baseURL: import.meta.env.VITE_SN_URL || 'https://dev323456.service-now.com',
    auth: {
      username: import.meta.env.VITE_SN_USER || 'admin',
      password: import.meta.env.VITE_SN_PASS || 'bz!T-1ThIc1L'
    },
    endpoints: {
      searchSpecs: '/api/now/table/sn_prd_pm_product_specification',
      createSpec: '/api/now/table/sn_prd_pm_product_specification',
      publishSpec: '/api/now/table/sn_prd_pm_product_specification/{sys_id}'
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
            text: formatSpecifications(response.data), 
            sender: 'bot',
            isData: true,
            options: getFollowUpOptions(response.intent)
          }]);
        }
      }
    } catch (error) {
      console.error("Erreur chatbot:", error);
      addBotMessage("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Traitement intelligent de l'entrée utilisateur
  const processUserInput = async (userInput) => {
    const intent = detectIntent(userInput);
    let response;
  
    switch(intent) {
      case 'search':
        const searchResults = await searchSpecifications();
        if (searchResults && searchResults.length > 0) {
          response = {
            text: "Voici les spécifications publiées disponibles:",
            sender: 'bot',
            data: searchResults,
            intent: 'search'
          };
        } else {
          response = {
            text: "Aucune spécification publiée n'a été trouvée.",
            sender: 'bot',
            intent: 'search'
          };
        }
        break;
        
      case 'publish':
        const specId = context?.lastCreatedId || extractSpecId(userInput);
        if (!specId) {
          return {
            text: "Je n'ai pas pu identifier quelle spécification vous voulez publier. Pouvez-vous préciser l'ID?",
            sender: 'bot',
            intent: 'clarify_publish'
          };
        }
        
        const publishedSpec = await publishSpecification(specId);
        response = {
          text: `Spécification ${publishedSpec.name} publiée avec succès!`,
          sender: 'bot',
          data: [publishedSpec],
          intent: 'publish',
          options: [
            "Voir toutes les spécifications publiées",
            "Créer une nouvelle spécification"
          ]
        };
        break;
  
        case 'knowledge':
          setCurrentStep('knowledge_query');
          return {
            text: "D'accord, sur quel sujet souhaitez-vous chercher un article de connaissance ?",
            sender: 'bot',
            intent: 'knowledge'
          };
        
  
      case 'help':
      default:
        response = {
          text: "Je peux vous aider avec:",
          sender: 'bot',
          options: [
            "Lister les spécifications",
            "Créer une nouvelle spécification",
            "Publier une spécification",
            "Afficher des articles de connaissance"
          ]
        };
    }
  
    return response;
  };
  

  const startSpecCreation = () => {
    setCurrentStep('name');
    setSpecData({
      name: '',
      display_name: '',
      category: '',
      type: '',
      start_date: '',
      end_date: '',
      owner: '',
      description: '',
      status: 'draft',
      external_code: '',
      line: '',
      cost_to_company: '',
      composite: false,
      installation_required: false,
      location_specific: false
    });
  };

  const processStepResponse = async (input) => {
    // Étape de recherche d'article de connaissance
    if (currentStep === 'knowledge_query') {
      const articles = await searchKnowledgeArticles(input);
      setCurrentStep(null);
    
      if (articles.length > 0) {
        addBotMessage("Voici quelques articles de connaissance qui peuvent vous aider :");
    
        setMessages(prev => [
          ...prev,
          {
            text: '',
            sender: 'bot',
            data: articles.map(article => ({
              name: article.short_description,
              number: article.display_number,
              topic: article.topic,
              body: article.text
            })),
            intent: 'knowledge'
          },
          {
            text: "Que souhaitez-vous faire maintenant ?",
            sender: 'bot',
            options: [
              "Lister les spécifications",
              "Créer une nouvelle spécification",
              "Aide-moi à publier une spécification",
              "Rechercher un article de connaissance"
            ]
          }
        ]);
      } else {
        addBotMessage("Aucun article trouvé pour votre demande.");
      }
      return;
    }
    
  
    switch(currentStep) {
      case 'name':
        setSpecData({...specData, name: input});
        setCurrentStep('display_name');
        addBotMessage(`Nom enregistré: ${input}. Quel est le nom d'affichage?`);
        break;
  
      case 'display_name':
        setSpecData({...specData, display_name: input});
        setCurrentStep('category');
       addBotMessage(`Nom d'affichage enregistré: ${input}. Quelle est la catégorie?`, [
          "connectivity",
          "Forfait",
          "hardware",
          "Internet",
          "Autre"
        ]);
        break;
  
      case 'category':
        setSpecData({...specData, category: input});
        setCurrentStep('type');
        addBotMessage(`Catégorie enregistrée: ${input}. Quel est le type?`);
        break;
  
      case 'type':
        setSpecData({...specData, type: input});
        setCurrentStep('start_date');
        addBotMessage(`Type enregistré: ${input}. Quelle est la date de début (format yyyy-MM-dd)?`);
        break;
  
      case 'start_date':
        if (!isValidDate(input)) {
          addBotMessage("Format de date invalide. Veuillez entrer la date au format yyyy-MM-dd.");
          return;
        }
        setSpecData({...specData, start_date: input});
        setCurrentStep('end_date');
        addBotMessage(`Date de début enregistrée: ${input}. Quelle est la date de fin (format yyyy-MM-dd)?`);
        break;
  
      case 'end_date':
        if (!isValidDate(input)) {
          addBotMessage("Format de date invalide. Veuillez entrer la date au format yyyy-MM-dd.");
          return;
        }
        setSpecData({...specData, end_date: input});
        setCurrentStep('owner');
        addBotMessage(`Date de fin enregistrée: ${input}. Qui est le propriétaire?`);
        break;
  
      case 'owner':
        setSpecData({...specData, owner: input});
        setCurrentStep('description');
        addBotMessage(`Propriétaire enregistré: ${input}. Veuillez fournir une description.`);
        break;
  
      case 'description':
        setSpecData({...specData, description: input});
        setCurrentStep('external_code');
        addBotMessage(Description enregistrée. Quel est le code externe?);
        break;
  
      case 'external_code':
        setSpecData({...specData, external_code: input});
        setCurrentStep('line');
        addBotMessage(`Code externe enregistré: ${input}. Quelle est la ligne de produit?`);
        break;
  
      case 'line':
        setSpecData({...specData, line: input});
        setCurrentStep('cost_to_company');
        addBotMessage(`Ligne de produit enregistrée: ${input}. Quel est le coût pour l'entreprise?`);
        break;
  
      case 'cost_to_company':
        setSpecData({...specData, cost_to_company: input});
        setCurrentStep('composite');
        addBotMessage(`Coût enregistré: ${input}. Est-ce une spécification composite?`, [
          "Oui",
          "Non"
        ]);
        break;
  
      case 'composite':
        const isComposite = input.toLowerCase() === 'oui';
        setSpecData({...specData, composite: isComposite});
        setCurrentStep('installation_required');
        addBotMessage(`Composite: ${isComposite ? 'Oui' : 'Non'}. Une installation est-elle requise?`, [
          "Oui",
          "Non"
        ]);
        break;
  
      case 'installation_required':
        const installationRequired = input.toLowerCase() === 'oui';
        setSpecData({...specData, installation_required: installationRequired});
        setCurrentStep('location_specific');
        addBotMessage(`Installation requise: ${installationRequired ? 'Oui' : 'Non'}. Est-ce spécifique à un lieu?`, [
          "Oui",
          "Non"
        ]);
        break;
  
      case 'location_specific':
        const locationSpecific = input.toLowerCase() === 'oui';
        setSpecData({...specData, location_specific: locationSpecific});
        confirmAndSaveSpec();
        break;
  
      default:
        addBotMessage("Je n'ai pas compris. Pouvez-vous répéter?");
    }
  };
  

  const isValidDate = (dateString) => {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if(!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    return !isNaN(d.getTime());
  };

  const confirmAndSaveSpec = () => {
    const confirmationMessage = `Voici le récapitulatif de votre spécification:
      - Nom: ${specData.name}
      - Nom d'affichage: ${specData.display_name}
      - Catégorie: ${specData.category}
      - Type: ${specData.type}
      - Dates: ${specData.start_date} à ${specData.end_date}
      - Propriétaire: ${specData.owner}
      - Description: ${specData.description}
      
      Voulez-vous enregistrer cette spécification?`;
    
    addBotMessage(confirmationMessage, [
      "Oui, enregistrer",
      "Non, modifier"
    ]);
    
    setCurrentStep('confirmation');
  };

  const saveSpecification = async () => {
    try {
      const response = await axios.post(SN_CONFIG.endpoints.createSpec, specData, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth
      });

      const savedSpec = response.data.result;
      setContext({ lastCreatedId: savedSpec.sys_id });
      addBotMessage(`Spécification enregistrée avec succès! Numéro: ${savedSpec.number}`);
      
      // Reset for new specification
      setCurrentStep(null);
      
      addBotMessage("Que souhaitez-vous faire maintenant?", [
        "Voir cette spécification",
        "Créer une nouvelle spécification",
        "Retour au menu principal"
      ]);
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      addBotMessage("Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.");
    }
  };

  // Détection d'intention améliorée
  const detectIntent = (text) => {
    text = text.toLowerCase();
  
    if (/(liste|afficher|voir|donner|chercher|recherche|trouver)/.test(text) && 
        /(spécification|spec|fiche|produit)/.test(text)) {
      return 'search';
    }
  
    if (/(créer|nouveau|nouvelle|ajouter|générer)/.test(text) && 
        /(spécification|spec|fiche)/.test(text)) {
      return 'create';
    }
  
    if (/(article|connaissance|aide|faq|question)/.test(text) || 
        text.includes("afficher des articles de connaissance")) {
      return 'knowledge';
    }
  
    if (/(aide|assistance|help|soutien)/.test(text)) {
      return 'help';
    }
  
    return 'help';
  };
  
  

  // Fonctions ServiceNow
  const searchSpecifications = async (query = '') => {
    try {
      const params = {
        sysparm_limit: 10,
        sysparm_query: 'status=published'
      };
      
      if (query) {
        params.sysparm_query = status=published^nameLIKE${query}^ORdescriptionLIKE${query};
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
            sysparm_query: workflow=published^short_descriptionLIKE${query},
            sysparm_limit: 5,
            sysparm_fields: 'short_description,display_number,topic,text',
            sysparm_display_value: true,
            sysparm_exclude_reference_link: true
          }
        }
      );
      return response.data.result;
    } catch (error) {
      console.error("❌ Erreur knowledge:", error);
      throw new Error("Impossible de récupérer les articles de connaissance.");
    }
  };
  
  

  const publishSpecification = async (specId) => {
    try {
      const response = await axios.patch(
        SN_CONFIG.endpoints.publishSpec.replace('{sys_id}', specId),
        { status: 'published' },
        { baseURL: SN_CONFIG.baseURL, auth: SN_CONFIG.auth }
      );

      return response.data.result;
    } catch (error) {
      console.error("Erreur publication:", error);
     throw new Error(`Erreur lors de la publication de la spécification ${specId}.`);
    }
  };

  // Fonctions d'extraction améliorées
  const extractSpecId = (text) => {
    const idRegex = /(SPEC|spec)[- ]?([A-Z0-9]{8,})/i;
    const match = text.match(idRegex);
    return match ? match[0] : null;
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
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">ID</th>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Catégorie</th>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Type</th>
              <th className="sticky top-0 bg-gray-50 font-semibold text-gray-700 p-2.5 border-b-2 border-gray-200">Statut</th>
            </tr>
          </thead>
          <tbody>
            {specs.map(spec => (
              <tr key={spec.sys_id} className="hover:bg-blue-50">
                <td className="p-2 border-b border-gray-100 align-top">{spec.name}</td>
                <td className="font-mono text-sm p-2 border-b border-gray-100 align-top">{spec.sys_id}</td>
                <td className="p-2 border-b border-gray-100 align-top">{spec.category || 'N/A'}</td>
                <td className="p-2 border-b border-gray-100 align-top">{spec.type || 'N/A'}</td>
                <td className="p-2 border-b border-gray-100 align-top">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    spec.status === 'draft' 
                      ? 'text-yellow-800 bg-yellow-100' 
                      : 'text-green-800 bg-green-100'
                  }`}>
                    {spec.status === 'draft' ? 'Brouillon' : 'Publiée'}
                  </span>
                </td>
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
            <h4 className="font-semibold text-blue-700 mb-2">{article.name}</h4>
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
            {article.body && (
              <div className="mt-2 text-gray-800 leading-6">
                <hr className="my-2" />
                <div dangerouslySetInnerHTML={{ __html: article.body }} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };  
  

  // Fonctions utilitaires
  const addBotMessage = (text, options = []) => {
    setMessages(prev => [...prev, { text, sender: 'bot', options }]);
  };

  const getFollowUpOptions = (intent) => {
    switch(intent) {
      case 'search':
        return ["Filtrer les résultats", "Publier une spécification"];
      case 'create':
        return ["Publier cette spécification", "Voir toutes les spécifications"];
      case 'publish':
        return ["Vérifier le statut", "Créer une nouvelle spécification"];
      default:
        return [];
    }
  };

  const handleQuickOption = (option) => {
    if (currentStep === 'confirmation') {
      if (option.includes("Oui")) {
        saveSpecification();
      } else {
        startSpecCreation();
        addBotMessage("Très bien, recommençons. Quel est le nom de la spécification?");
      }
      return;
    }
    
    setInput(option);
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  return (
    <div className={fixed bottom-8 right-8 z-[1000] transition-all duration-300 ease-in-out ${isOpen ? 'open' : ''}}>
      <button 
        className="flex items-center bg-blue-600 text-white border-none rounded-[50px] py-3.5 px-6 cursor-pointer shadow-md transition-all duration-300 ease-in-out font-medium hover:bg-blue-700 hover:scale-105"
        onClick={toggleChatbot}
      >
        <div className="w-6 h-6 mr-2.5">
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <span>Assistant</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[550px] h-[400px] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden origin-bottom-right animate-fadeIn">
          <div className="bg-blue-600 text-white p-4 relative">
            <h2 className="m-0 text-xl font-semibold">Assistant Spécifications</h2>
            <p className="mt-2 mb-0 text-sm opacity-90">Comment puis-je vous aider?</p>
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
                className={`mb-4 max-w-[85%] animate-messageAppear ${
                  msg.sender === 'user' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className={`px-4 py-3 rounded-2xl leading-6 text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                  {msg.data && (msg.intent === 'knowledge' ? formatArticles(msg.data) : formatSpecifications(msg.data))}
                  
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
                  <span className="h-2 w-2 bg-gray-600 rounded-full inline-block mx-1 animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="h-2 w-2 bg-gray-600 rounded-full inline-block mx-1 animate-bounce" style={{animationDelay: '0.4s'}}></span>
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
