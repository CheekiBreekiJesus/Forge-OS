import type { Dictionary } from "../dictionaries";

export const dictionary: Dictionary = {
  app: {
    name: "ForgeOS",
    tenantLabel: "Empresa de referência",
    environment: "Base de protótipo",
    openMenu: "Abrir menu de navegação",
    closeMenu: "Fechar menu de navegação"
  },
  navigation: {
    dashboard: "Painel",
    customers: "Clientes",
    products: "Produtos",
    orders: "Encomendas",
    production: "Produção",
    inventory: "Inventário",
    machines: "Máquinas",
    maintenance: "Manutenção",
    marketing: "Marketing",
    leadops: "LeadOps",
    settings: "Definições"
  },
  dashboard: {
    searchPlaceholder: "Pesquisar...",
    searchShortcut: "Ctrl + K",
    dateRange: "Demo",
    customize: "Personalizar",
    greeting: "Bom dia, operador.",
    userRole: "Diretor Geral",
    eyebrow: "Sistema operativo industrial",
    title: "Aqui está o resumo da sua operação.",
    description: "Base estática de protótipo para o MVP do ForgeOS.",
    primaryAction: "Rever módulos MVP",
    secondaryAction: "Abrir definições",
    operationalSnapshot: "Resumo operacional",
    modulesTitle: "Módulos MVP em preparação",
    nextStepsTitle: "Próximas tarefas recomendadas",
    languageLabel: "Idioma",
    status: {
      prototype: "Protótipo",
      foundation: "Base",
      planned: "Planeado",
      online: "Online",
      operational: "Operacional",
      production: "Produção"
    },
    metrics: [
      {
        label: "Produção OEE",
        value: "78.5%",
        detail: "vs semana passada",
        trend: "+ 6.4%",
        tone: "green"
      },
      {
        label: "Receita semanal",
        value: "124,850",
        detail: "vs semana passada",
        trend: "+ 12.7%",
        tone: "green"
      },
      {
        label: "Orçamentos abertos",
        value: "18",
        detail: "vs semana passada",
        trend: "+ 2",
        tone: "blue"
      },
      {
        label: "Encomendas atrasadas",
        value: "7",
        detail: "vs semana passada",
        trend: "- 3",
        tone: "red"
      },
      {
        label: "Alertas de manutenção",
        value: "5",
        detail: "vs semana passada",
        trend: "- 1",
        tone: "amber"
      }
    ],
    demoCards: {
      leads: "Leads",
      quotes: "Orçamentos",
      productionOrders: "Ordens de produção",
      pendingArtwork: "Artes pendentes",
      pendingScreens: "Quadros pendentes",
      inventoryAlerts: "Alertas de inventário",
      todayJobs: "Trabalhos de hoje",
      recentActivity: "Atividade recente"
    },
    demoCardDetails: {
      leads: "novos",
      quotes: "aprovados",
      productionOrders: "bloqueadas",
      pendingArtwork: "Aprovação de logo/artwork",
      pendingScreens: "Preparação de quadros",
      inventoryAlerts: "Abaixo do limite disponível",
      todayJobs: "Agendados para 2026-06-15",
      recentActivity: "Eventos demo prontos para n8n"
    },
    demoSections: {
      todayJobs: "Trabalhos JH Gomes de hoje",
      inventoryAlerts: "Alertas de inventário",
      productCatalog: "Catálogo de produtos JH Gomes",
      recentActivity: "Atividade recente",
      viewCatalog: "Abrir catálogo",
      noAlerts: "Sem alertas de inventário",
      openJobCard: "Abrir cartão",
      minimumPrefix: "min",
      unitsPerBox: "unidades/caixa"
    },
    production: {
      title: "Produção - OEE",
      score: "78.5%",
      availability: "Disponibilidade",
      performance: "Performance",
      quality: "Qualidade",
      days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    },
    inventory: {
      title: "Inventário - Resumo",
      viewAll: "Ver tudo",
      items: [
        {
          name: "ABS natural",
          category: "Matéria-prima",
          quantity: "2,450 kg",
          minimum: "Min: 1,000 kg",
          tone: "green"
        },
        {
          name: "Polipropileno",
          category: "Matéria-prima",
          quantity: "1,200 kg",
          minimum: "Min: 1,000 kg",
          tone: "amber"
        },
        {
          name: "Aço P20",
          category: "Matéria-prima",
          quantity: "850 kg",
          minimum: "Min: 1,000 kg",
          tone: "red"
        },
        {
          name: "Embalagem caixa M",
          category: "Material de embalagem",
          quantity: "1,500 un",
          minimum: "Min: 500 un",
          tone: "green"
        },
        {
          name: "Produto acabado A",
          category: "Produto acabado",
          quantity: "320 un",
          minimum: "Min: 200 un",
          tone: "green"
        }
      ]
    },
    activity: {
      title: "Alertas e atividade",
      viewAll: "Ver tudo",
      items: [
        {
          title: "Manutenção preventiva no injetor 02",
          detail: "Vence em 2 dias",
          time: "09:15",
          priority: "Alta",
          tone: "red"
        },
        {
          title: "Molde JG-102 precisa de manutenção",
          detail: "Próxima semana",
          time: "08:47",
          priority: "Média",
          tone: "amber"
        },
        {
          title: "Ordem de produção OP-045 atrasada",
          detail: "Atraso de 1 dia",
          time: "08:30",
          priority: "Alta",
          tone: "red"
        },
        {
          title: "Stock baixo: Aço P20",
          detail: "Abaixo do mínimo",
          time: "07:58",
          priority: "Alta",
          tone: "red"
        },
        {
          title: "Orçamento Q-0487 aguarda resposta",
          detail: "Cliente: conta demo",
          time: "Ontem",
          priority: "Baixa",
          tone: "green"
        }
      ]
    },
    orders: {
      title: "Encomendas de produção",
      viewAll: "Ver todas",
      headers: {
        order: "Ordem",
        product: "Produto",
        quantity: "Quantidade",
        progress: "Progresso",
        delivery: "Entrega"
      },
      rows: [
        {
          order: "OP-045",
          product: "Caixa técnica A",
          quantity: "1,200 un",
          progress: "65%",
          delivery: "17 Mai",
          tone: "green"
        },
        {
          order: "OP-046",
          product: "Suporte B",
          quantity: "800 un",
          progress: "40%",
          delivery: "18 Mai",
          tone: "amber"
        },
        {
          order: "OP-047",
          product: "Tampa C",
          quantity: "500 un",
          progress: "80%",
          delivery: "20 Mai",
          tone: "green"
        },
        {
          order: "OP-048",
          product: "Conjunto D",
          quantity: "300 un",
          progress: "20%",
          delivery: "21 Mai",
          tone: "red"
        }
      ]
    },
    copilot: {
      title: "AI Copilot",
      badge: "Beta",
      prompt: "Quais moldes precisam de manutenção no próximo mês?",
      answer:
        "Este protótipo mantém a IA desativada. O futuro assistente deve resumir registos operacionais com isolamento por empresa depois das regras de privacidade estarem definidas.",
      input: "Pergunte algo..."
    },
    modules: [
      {
        key: "dashboard",
        title: "Painel",
        description: "Visão geral para equipas operacionais.",
        status: "Base"
      },
      {
        key: "customers",
        title: "Clientes",
        description: "Futuros registos de CRM e atividade de clientes.",
        status: "Planeado"
      },
      {
        key: "products",
        title: "Produtos",
        description: "Futuros produtos, variantes e parâmetros de produção.",
        status: "Planeado"
      },
      {
        key: "orders",
        title: "Encomendas",
        description: "Futuras encomendas e requisitos de trabalho.",
        status: "Planeado"
      },
      {
        key: "production",
        title: "Produção",
        description: "Futuras ordens de produção e fichas técnicas.",
        status: "Planeado"
      },
      {
        key: "inventory",
        title: "Inventário",
        description: "Futuros registos de stock para materiais e consumíveis.",
        status: "Planeado"
      },
      {
        key: "machines",
        title: "Máquinas",
        description: "Futuros registos de equipamento e documentação de setup.",
        status: "Planeado"
      },
      {
        key: "maintenance",
        title: "Manutenção",
        description: "Futuras tarefas de manutenção preventiva e corretiva.",
        status: "Planeado"
      },
      {
        key: "marketing",
        title: "Marketing",
        description: "Futuro apoio a conteúdos e campanhas.",
        status: "Planeado"
      },
      {
        key: "settings",
        title: "Definições",
        description: "Futura configuração da empresa e controlos de idioma.",
        status: "Planeado"
      }
    ],
    nextSteps: [
      "Escolher base de dados, ORM e fornecedor de autenticação.",
      "Definir membros da empresa, funções e limites de acesso.",
      "Criar os primeiros esquemas de clientes, produtos, encomendas e produção.",
      "Manter todo o texto operacional nos dicionários de localização."
    ],
    footer: {
      version: "ForgeOS v0.1.0",
      copyright: "Base de protótipo. Não inclui dados operacionais privados.",
      system: "Sistema",
      database: "Base de dados",
      backup: "Backup",
      environment: "Ambiente",
      support: "Suporte"
    }
  },
  modulePage: {
    backToDashboard: "Voltar ao painel",
    prototypeNotice: "Página estática de planeamento MVP. Dados, permissões e isolamento por empresa ainda não estão implementados.",
    primaryAction: "Definir esquema",
    secondaryAction: "Rever fluxo",
    readinessTitle: "Preparação",
    roadmapTitle: "Próximos passos de construção",
    emptyStateTitle: "Ainda não existem registos",
    emptyStateDescription: "Este módulo está pronto para desenho de UI e modelo de dados, mas ainda não guarda dados de negócio.",
    tableHeaders: {
      area: "Área",
      priority: "Prioridade",
      status: "Estado",
      owner: "Responsável"
    },
    modules: {
      customers: {
        eyebrow: "Base CRM",
        title: "Clientes",
        description: "Preparar a área de clientes para registos por empresa, contactos, notas e histórico de encomendas.",
        stats: [
          { label: "Modelo de dados", value: "Rascunho", detail: "Os campos de cliente existem nos documentos de passagem." },
          { label: "Privacidade", value: "Alta", detail: "Dados de contacto não devem aparecer em seed data." },
          { label: "Fluxo MVP", value: "Próximo", detail: "Lista, detalhe e criação rápida." }
        ],
        roadmap: ["Confirmar campos obrigatórios de cliente.", "Desenhar lista e detalhe com isolamento por empresa.", "Adicionar validação antes de persistência."],
        tableRows: [
          { area: "Lista de clientes", priority: "Alta", status: "Planeado", owner: "CRM" },
          { area: "Detalhe de cliente", priority: "Alta", status: "Planeado", owner: "CRM" },
          { area: "Notas de contacto", priority: "Média", status: "Planeado", owner: "CRM" }
        ]
      },
      products: {
        eyebrow: "Base de catálogo",
        title: "Produtos",
        description: "Preparar produtos e variantes para artigos fabricados, consumíveis e parâmetros de produção por empresa.",
        stats: [
          { label: "Variantes", value: "Necessário", detail: "Tamanhos de copo e opções de produto precisam de variantes." },
          { label: "Parâmetros", value: "Config", detail: "Velocidade e setup devem ser configuráveis por empresa." },
          { label: "Fluxo MVP", value: "Próximo", detail: "Lista, detalhe e configuração de variantes." }
        ],
        roadmap: ["Definir formulários de produto e variantes.", "Separar parâmetros reutilizáveis dos defaults da empresa.", "Ligar produtos a encomendas e produção mais tarde."],
        tableRows: [
          { area: "Lista de produtos", priority: "Alta", status: "Planeado", owner: "Produtos" },
          { area: "Variantes", priority: "Alta", status: "Planeado", owner: "Produtos" },
          { area: "Defaults de produção", priority: "Média", status: "Planeado", owner: "Produção" }
        ]
      },
      orders: {
        eyebrow: "Operações de encomendas",
        title: "Encomendas",
        description: "Preparar seguimento de encomendas com linhas, datas pedidas de entrega e futura criação de ordens de produção.",
        stats: [
          { label: "Linhas", value: "Obrigatório", detail: "Uma encomenda pode incluir vários produtos." },
          { label: "Estados", value: "Rascunho", detail: "O fluxo de estados ainda precisa de confirmação." },
          { label: "Fluxo MVP", value: "Próximo", detail: "Lista, detalhe e captura de linhas." }
        ],
        roadmap: ["Confirmar nomes dos estados de encomenda.", "Desenhar entrada rápida para encomendas por telefone.", "Ligar linhas a ordens de produção mais tarde."],
        tableRows: [
          { area: "Lista de encomendas", priority: "Alta", status: "Planeado", owner: "Encomendas" },
          { area: "Detalhe da encomenda", priority: "Alta", status: "Planeado", owner: "Encomendas" },
          { area: "Linhas", priority: "Alta", status: "Planeado", owner: "Encomendas" }
        ]
      },
      production: {
        eyebrow: "Fluxo de fábrica",
        title: "Produção",
        description: "Preparar ordens de produção, fichas técnicas, notas de setup, controlos de qualidade, rejeições e notas de operador.",
        stats: [
          { label: "Fichas técnicas", value: "Core", detail: "Devem existir modelos reutilizáveis e cópias por trabalho." },
          { label: "Rejeições", value: "MVP", detail: "Quantidades planeadas, produzidas e rejeitadas são importantes." },
          { label: "Impressão", value: "Depois", detail: "As fichas de produção devem poder ser impressas." }
        ],
        roadmap: ["Definir ciclo de vida da ordem de produção.", "Desenhar estrutura da ficha técnica.", "Adicionar impressão/exportação depois dos dados core."],
        tableRows: [
          { area: "Lista de trabalhos", priority: "Alta", status: "Planeado", owner: "Produção" },
          { area: "Fichas técnicas", priority: "Alta", status: "Planeado", owner: "Produção" },
          { area: "Controlos de qualidade", priority: "Média", status: "Planeado", owner: "Produção" }
        ]
      },
      inventory: {
        eyebrow: "Base de armazém",
        title: "Inventário",
        description: "Preparar registos básicos de stock para materiais, produtos acabados, consumíveis, peças e níveis de reposição.",
        stats: [
          { label: "Stock", value: "MVP", detail: "Quantidade em mão antes de movimentos." },
          { label: "Localizações", value: "Depois", detail: "O modelo de localização ainda precisa de confirmação." },
          { label: "Reposição", value: "Necessário", detail: "Limites devem ser configuráveis por empresa." }
        ],
        roadmap: ["Definir categorias de item de inventário.", "Criar estados básicos da lista de stock.", "Adiar movimentos de stock até validar o básico."],
        tableRows: [
          { area: "Lista de stock", priority: "Alta", status: "Planeado", owner: "Inventário" },
          { area: "Limites de reposição", priority: "Média", status: "Planeado", owner: "Inventário" },
          { area: "Fornecedores", priority: "Média", status: "Adiado", owner: "Compras" }
        ]
      },
      machines: {
        eyebrow: "Registos de equipamento",
        title: "Máquinas",
        description: "Preparar registos de máquinas, documentação de setup, estado e ligações a produção e manutenção.",
        stats: [
          { label: "Registo", value: "MVP", detail: "Nome, tipo, modelo, estado e notas." },
          { label: "Setup", value: "Necessário", detail: "Útil antes de telemetria complexa." },
          { label: "Telemetria", value: "Adiado", detail: "Não faz parte do primeiro MVP." }
        ],
        roadmap: ["Definir campos de máquina.", "Desenhar ecrãs de documentação de setup.", "Ligar máquinas a trabalhos e manutenção mais tarde."],
        tableRows: [
          { area: "Lista de máquinas", priority: "Alta", status: "Planeado", owner: "Máquinas" },
          { area: "Notas de setup", priority: "Alta", status: "Planeado", owner: "Produção" },
          { area: "Telemetria", priority: "Baixa", status: "Adiado", owner: "Máquinas" }
        ]
      },
      maintenance: {
        eyebrow: "Base CMMS",
        title: "Manutenção",
        description: "Preparar manutenção preventiva e corretiva para máquinas, notas de paragem e uso de peças.",
        stats: [
          { label: "Tarefas", value: "Planeado", detail: "Tipos preventivo e corretivo." },
          { label: "Paragens", value: "Depois", detail: "Registar depois de existirem máquinas." },
          { label: "Peças", value: "Depois", detail: "Ligar ao inventário depois do stock básico." }
        ],
        roadmap: ["Definir estados de tarefa de manutenção.", "Criar lista e detalhe ligados a máquinas.", "Ligar peças após existir inventário."],
        tableRows: [
          { area: "Lista de tarefas", priority: "Média", status: "Planeado", owner: "Manutenção" },
          { area: "Ligação à máquina", priority: "Média", status: "Planeado", owner: "Máquinas" },
          { area: "Peças", priority: "Baixa", status: "Adiado", owner: "Inventário" }
        ]
      },
      marketing: {
        eyebrow: "Ferramentas de conteúdo",
        title: "Marketing",
        description: "Preparar uma área simples para ideias de conteúdo, assets, notas de campanha e futura escrita assistida por IA.",
        stats: [
          { label: "Assets", value: "Depois", detail: "MarketingAsset existe no rascunho do modelo de dados." },
          { label: "Brevo", value: "Adiado", detail: "Sem integração direta na base." },
          { label: "IA", value: "Adiado", detail: "Fornecedor e regras de privacidade por definir." }
        ],
        roadmap: ["Definir campos de asset de marketing.", "Manter conteúdo localizado por idioma.", "Adiar integrações externas."],
        tableRows: [
          { area: "Lista de assets", priority: "Baixa", status: "Planeado", owner: "Marketing" },
          { area: "Notas de campanha", priority: "Baixa", status: "Planeado", owner: "Marketing" },
          { area: "Integração email", priority: "Baixa", status: "Adiado", owner: "Marketing" }
        ]
      },
      settings: {
        eyebrow: "Configuração da empresa",
        title: "Definições",
        description: "Preparar definições de empresa para idioma por defeito, configuração, utilizadores, funções e futuras permissões.",
        stats: [
          { label: "Idioma base", value: "pt-PT", detail: "A instalação de referência usa português europeu." },
          { label: "Utilizadores", value: "Adiado", detail: "É necessário escolher fornecedor de autenticação." },
          { label: "Funções", value: "Rascunho", detail: "Existem nomes de funções, mas permissões estão em aberto." }
        ],
        roadmap: ["Escolher fornecedor de autenticação.", "Definir regras de membros por empresa.", "Adicionar convenções seguras de variáveis de ambiente."],
        tableRows: [
          { area: "Perfil da empresa", priority: "Alta", status: "Planeado", owner: "Admin" },
          { area: "Utilizadores e funções", priority: "Alta", status: "Bloqueado", owner: "Auth" },
          { area: "Localização", priority: "Alta", status: "Base", owner: "Plataforma" }
        ]
      }
    }
  },
  productCatalog: {
    eyebrow: "Catálogo demo JH Gomes",
    title: "Catálogo de produtos",
    description:
      "Produtos demo por empresa para copos personalizados, embalagens, sacos, tampas e acessórios. Estes registos são dados sintéticos de demonstração e não incluem dados privados de clientes ou fornecedores.",
    sourceNotice:
      "source_url existe para futuras importações públicas. Os produtos demo atuais foram criados manualmente e não usam dados privados recolhidos.",
    fieldsTitle: "Campos obrigatórios do produto",
    categories: {
      "personalized-cups": "Copos personalizados",
      "paper-cups": "Copos de papel",
      "reusable-cups": "Copos reutilizáveis",
      "takeaway-packaging": "Embalagem takeaway",
      bags: "Sacos",
      lids: "Tampas",
      accessories: "Acessórios"
    },
    fields: {
      sku: "SKU",
      category: "Categoria",
      image: "Imagem",
      material: "Material",
      capacity: "Capacidade",
      color: "Cor",
      unitsPerBox: "Unidades/caixa",
      stacksPerBox: "Pilhas/caixa",
      unitsPerStack: "Unidades/pilha",
      compatible: "Tampas/acessórios compatíveis",
      basePrice: "Preço base",
      personalization: "Personalização",
      printArea: "Área de impressão",
      setupCost: "Custo de setup",
      screenCost: "Custo de quadro",
      leadTime: "Prazo",
      sourceUrl: "Source URL"
    },
    yes: "Sim",
    no: "Não",
    days: "dias"
  },
  demoWorkflow: {
    eyebrow: "Fluxo demo JH Gomes",
    title: "Demo de CRM até produção",
    description:
      "Execute o fluxo principal localmente: lead, oportunidade, orçamento de copo personalizado, artwork, aprovação, ordem de produção, cartão de trabalho, máquina, progresso e reserva de inventário.",
    startDemo: "Executar demo completo",
    currentStep: "Passo atual",
    reset: "Reiniciar demo",
    sections: {
      lead: "Lead e oportunidade",
      quote: "Orçamento de copo personalizado",
      production: "Ordem de produção",
      jobCard: "Cartão de trabalho da máquina",
      inventory: "Reserva de inventário",
      events: "Eventos de automação",
      automation: "Email e hooks n8n",
      copilot: "Shell AI Copilot"
    },
    steps: [
      "Criar lead",
      "Converter em cliente/oportunidade",
      "Criar orçamento",
      "Carregar artwork",
      "Aprovar orçamento",
      "Criar ordem de produção",
      "Atribuir máquina",
      "Atualizar estado da arte e quadro",
      "Registar progresso",
      "Reservar inventário"
    ],
    fields: {
      company: "Empresa",
      contact: "Contacto",
      product: "Produto",
      quantity: "Quantidade",
      printColors: "Cores de impressão",
      artwork: "Artwork",
      subtotal: "Subtotal",
      vat: "IVA",
      total: "Total",
      machine: "Máquina",
      progress: "Progresso",
      available: "Disponível",
      reserved: "Reservado",
      ink: "Tinta",
      personalizationCost: "Personalização",
      demoArtworkFile: "demo-logo.svg",
      emptyValue: "-",
      unitSuffix: "un"
    },
    actions: {
      createLead: "Criar lead",
      convertLead: "Converter lead",
      createQuote: "Criar orçamento",
      uploadArtwork: "Carregar artwork",
      approveQuote: "Aprovar orçamento",
      createProduction: "Criar produção",
      assignMachine: "Atribuir máquina",
      updateStatuses: "Atualizar estados",
      logProgress: "Registar progresso",
      reserveInventory: "Reservar inventário"
    },
    status: {
      waiting: "Em espera",
      done: "Concluído",
      active: "Ativo"
    },
    jobCardLabels: {
      orderId: "ID da ordem",
      customer: "Cliente",
      cupCapacity: "Capacidade do copo",
      material: "Material",
      artworkStatus: "Estado da arte",
      screenStatus: "Estado do quadro",
      predictedInk: "Tinta prevista",
      loading: "Pilhas/carregamento",
      loadingBay: "Capacidade de carga",
      assignedMachine: "Máquina atribuída",
      operatorNotes: "Notas do operador",
      logoPreview: "Pré-visualização do logo",
      label: "Etiqueta/autocolante",
      qrUrl: "URL do trabalho para QR"
    },
    automationLabels: {
      quoteRequest: "Modelo do formulário de pedido",
      emailTemplates: "Templates de email",
      webhookQueue: "Fila de webhooks n8n",
      destination: "Destino",
      payload: "Payload",
      status: "Estado"
    },
    copilotLabels: {
      suggestedPrompts: "Prompts sugeridos",
      answer: "Resposta demo",
      actionRegistry: "Registo placeholder de ações"
    }
  },
  login: {
    eyebrow: "Acesso demo",
    title: "Entrar no ForgeOS",
    description: "Use o workspace demo da JH Gomes. Este é um ecrã local de demonstração e ainda não ativa autenticação real.",
    tenant: "Empresa",
    user: "Utilizador demo",
    password: "Palavra-passe",
    submit: "Entrar no painel",
    note: "Supabase Auth deve substituir este placeholder no MVP persistente."
  },
  leadops: {
    eyebrow: "Operações de leads outbound",
    title: "Painel LeadOps",
    description:
      "Reveja leads importados, progresso de campanhas e estado de outreach para o tenant demo. Os dados são sintéticos e isolados por tenant.",
    backToDashboard: "Voltar ao LeadOps",
    searchPlaceholder: "Pesquisar empresa, contacto, email, localização, origem ou website",
    clearFilters: "Limpar filtros",
    resultCount: "{count} leads visíveis",
    addToCampaign: "Adicionar a campanha",
    addToCampaignDisabled: "A atribuição a campanhas está desativada neste incremento demo.",
    selectAllVisible: "Selecionar todos os visíveis",
    emptyTitle: "Ainda não existem leads importados",
    emptyDescription: "Importe uma base de leads ou carregue dados demo para iniciar workflows de outreach.",
    noResultsTitle: "Nenhum lead corresponde aos filtros",
    noResultsDescription: "Experimente limpar filtros ou alargar os termos de pesquisa.",
    detailEyebrow: "Detalhe do lead",
    detailTitle: "Perfil do lead",
    detailDescription: "Placeholder mínimo para o próximo incremento de detalhe e compositor de email LeadOps.",
    detailPlaceholder: "Compositor de email, linha temporal e atribuição a campanhas serão adicionados num incremento posterior.",
    sections: {
      kpis: "KPIs de outreach",
      campaigns: "Resumo de campanhas",
      activity: "Atividade recente",
      leads: "Lista de leads"
    },
    kpis: {
      totalLeads: "Total de leads",
      ready: "Prontos",
      queued: "Em fila",
      contactedSent: "Contactados / enviados",
      replies: "Respostas",
      positiveReplies: "Respostas positivas",
      bounceRate: "Taxa de bounce",
      bounceRateUnavailable: "N/D",
      activeCampaigns: "Campanhas ativas"
    },
    filters: {
      industry: "Indústria",
      status: "Estado",
      quality: "Qualidade",
      sourceDatabase: "Base de origem",
      language: "Idioma",
      all: "Todos"
    },
    table: {
      company: "Empresa",
      contact: "Contacto",
      email: "Email",
      location: "Localização",
      industry: "Indústria",
      status: "Estado",
      quality: "Qualidade",
      source: "Origem",
      language: "Idioma",
      viewLead: "Abrir lead",
      selectedCount: "{count} selecionados"
    },
    statuses: {
      ready: "Pronto",
      queued: "Em fila",
      contacted: "Contactado",
      replied: "Respondeu",
      positive_reply: "Resposta positiva",
      bounced: "Bounce"
    },
    qualities: {
      high: "Alta",
      medium: "Média",
      low: "Baixa"
    },
    campaignStatuses: {
      active: "Ativa",
      paused: "Em pausa",
      completed: "Concluída"
    },
    activities: {
      "lead-imported": "Lead importado",
      "campaign-started": "Campanha iniciada",
      "reply-received": "Resposta recebida",
      "bounce-detected": "Bounce detetado",
      "lead-qualified": "Lead qualificado",
      "message-generated": "Mensagem gerada",
      "message-edited": "Mensagem editada",
      "message-approved": "Mensagem aprovada",
      "campaign-assigned": "Campanha atribuída",
      "message-queued": "Mensagem em fila",
      "message-sent": "Mensagem enviada",
      "metrics-updated": "Métricas atualizadas"
    },
    detailFields: {
      company: "Empresa",
      contact: "Contacto",
      email: "Email",
      location: "Localização",
      industry: "Indústria",
      status: "Estado",
      quality: "Qualidade",
      source: "Origem",
      sourceDatabase: "Base de origem",
      language: "Idioma",
      website: "Website"
    },
    detailWorkspace: {
      contactPanel: "Empresa e contacto",
      contextPanel: "Contexto da empresa",
      productsPanel: "Produtos recomendados",
      composerPanel: "Compositor de email",
      campaignPanel: "Campanha demo",
      sequencePanel: "Preview da sequência",
      activityPanel: "Linha temporal",
      importSummary: "Resumo da fonte de dados",
      noWebsiteContext: "Sem contexto de website disponível",
      websiteContextAvailable: "Contexto de website disponível",
      personalizationWarning: "Personalização limitada: não afirmar revisão de website sem contexto.",
      selectedProducts: "Produtos selecionados",
      tone: "Tom",
      professional: "Profissional",
      friendly: "Próximo",
      direct: "Direto",
      generate: "Gerar email PT-PT",
      subject: "Assunto",
      body: "Mensagem",
      method: "Método",
      edited: "Editado",
      approved: "Aprovado",
      notApproved: "Por aprovar",
      approve: "Aprovar mensagem",
      queue: "Colocar em fila",
      simulateSend: "Simular envio",
      campaign: "Campanha",
      providerState: "Estado do provider",
      queuedAt: "Em fila em",
      sentAt: "Enviado em",
      success: "Operação concluída.",
      error: "Ação bloqueada.",
      sequenceDelay: "Atraso",
      importTotal: "Importados",
      importValid: "Válidos",
      importReview: "Em revisão",
      importReady: "Prontos",
      phone: "Telefone",
      hiddenDemoValue: "Oculto no demo",
      noCampaign: "Sem campanha",
      incompleteMessage: "Mensagem incompleta.",
      queueRequired: "A mensagem precisa de estar em fila.",
      emptyActivity: "A atividade do demo aparece aqui.",
      manualProductReason: "Produto disponível para seleção manual."
    },
    providerStates: {
      not_ready: "Não preparado",
      draft: "Rascunho",
      approved: "Aprovado",
      queued: "Em fila",
      sent: "Enviado",
      blocked: "Bloqueado"
    }
  },
  jobCard: {
    backToProduction: "Voltar à produção",
    eyebrow: "Cartão do operador",
    title: "Cartão de trabalho de produção",
    description:
      "Instruções demo em modo leitura para a fábrica. Aprovações reais, qualidade e movimentos de stock ainda estão pendentes.",
    status: "Estado",
    scheduledDate: "Data planeada",
    progress: "Progresso",
    sections: {
      production: "Contexto de produção",
      machine: "Setup da máquina",
      artwork: "Arte e impressão",
      packing: "Embalamento",
      notes: "Notas do operador"
    },
    fields: {
      customer: "Cliente",
      product: "Produto",
      quantity: "Quantidade",
      machine: "Máquina",
      speed: "Velocidade/hora",
      loadingBay: "Capacidade de carga",
      artworkStatus: "Estado da arte",
      screenStatus: "Estado do quadro",
      capacity: "Capacidade",
      material: "Material",
      ink: "Tinta prevista",
      loading: "Pilhas/caixas",
      qrUrl: "URL QR"
    }
  }
};
