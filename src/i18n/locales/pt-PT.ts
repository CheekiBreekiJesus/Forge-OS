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
    crm: "CRM",
    customers: "Clientes",
    products: "Produtos",
    orders: "Orçamentos",
    salesOrders: "Encomendas",
    production: "Produção",
    inventory: "Inventário",
    machines: "Máquinas",
    maintenance: "Manutenção",
    molds: "Moldes",
    quality: "Qualidade",
    purchasing: "Compras",
    suppliers: "Fornecedores",
    sales: "Vendas",
    billing: "Faturação",
    reports: "Relatórios",
    marketing: "Marketing",
    leadops: "Contactos Comerciais",
    settings: "Configurações"
  },
  dashboard: {
    searchPlaceholder: "Pesquisar...",
    searchShortcut: "Ctrl + K",
    dateRange: "Demo",
    dateRangeThisWeek: "Esta semana",
    customize: "Personalizar",
    demoLabel: "Dados de pré-visualização",
    theme: {
      switchToLight: "Mudar para tema claro",
      switchToDark: "Mudar para tema escuro"
    },
    sidebar: {
      newBadge: "Novo",
      newTitle: "Novo no ForgeOS",
      newAction: "Ver novidades",
      planTitle: "Empresa de referência",
      planSubtitle: "Plano profissional"
    },
    greeting: "Bom dia, operador.",
    userName: "Operador",
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
      backupDemo: "Há 2 horas",
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
    days: "dias",
    loading: "A carregar produtos…",
    empty: "Ainda sem produtos.",
    actions: { create: "Novo produto" },
    table: {
      sku: "SKU",
      name: "Nome",
      category: "Categoria",
      price: "Preço base"
    },
    form: {
      createTitle: "Criar produto",
      editTitle: "Editar produto",
      name: "Nome",
      sku: "SKU",
      category: "Categoria",
      basePrice: "Preço base",
      productPageUrl: "URL da página do produto",
      emailTitle: "Título do email",
      emailPromotable: "Promovível em emails de outreach",
      required: "Nome e SKU são obrigatórios."
    }
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
      unitSuffix: "un",
      demoNotesDefault: "Lead demo para copos personalizados de eventos."
    },
    actions: {
      createLead: "Criar lead",
      qualifyLead: "Qualificar lead",
      convertLead: "Converter em cliente",
      openOutreach: "Abrir em Contactos Comerciais",
      createQuote: "Criar orçamento",
      uploadArtwork: "Carregar artwork",
      approveQuote: "Aprovar orçamento",
      createProduction: "Criar ordem de produção",
      openJobCard: "Abrir cartão de trabalho",
      assignMachine: "Atribuir máquina",
      updateStatuses: "Atualizar estados",
      logProgress: "Registar progresso",
      logProduction: "Registar atividade de produção",
      reserveInventory: "Reservar inventário"
    },
    resetData: "Repor dados demo",
    resetConfirm:
      "Isto repoe os registos demo iniciais e mantem leads importados, registos manuais, definicoes, rascunhos, orcamentos, ordens de producao e assets carregados. Continuar?",
    cancel: "Cancelar",
    actionRunning: "A executar…",
    resultSuccess: "Ação concluída",
    resultError: "Ação falhou",
    openInLeadops: "Abrir em Contactos Comerciais",
    openCustomer: "Abrir cliente",
    openQuotation: "Abrir orçamento",
    openProduction: "Abrir ordem de produção",
    persistence: {
      loading: "A carregar base de dados local…",
      unavailable: "Persistência local indisponível"
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
    note: "Supabase Auth deve substituir este placeholder no MVP persistente.",
    googleSignIn: "Continuar com Google",
    microsoftSignIn: "Continuar com Microsoft",
    loadingGoogle: "A abrir login Google...",
    loadingMicrosoft: "A abrir login Microsoft...",
    orContinueLocal: "ou continuar com demo local",
    hostedOnlyNote:
      "A autenticacao alojada esta ativa. Use Google ou Microsoft para confirmar identidade antes da verificacao da associacao ao tenant.",
    membershipNote:
      "OAuth confirma apenas a identidade. O acesso continua a exigir uma associacao ativa ao tenant ForgeOS.",
    errors: {
      missing_code: "O callback de login nao recebeu codigo de autorizacao. Tente novamente.",
      oauth_exchange_failed:
        "Nao foi possivel concluir o login. Tente novamente ou contacte o administrador ForgeOS.",
      oauth_provider_failed:
        "Nao foi possivel iniciar o login do fornecedor. Verifique a configuracao e tente novamente.",
      supabase_not_configured:
        "A configuracao publica de autenticacao Supabase nao esta definida para este ambiente.",
      tenant_access_denied:
        "A autenticacao foi concluida, mas esta conta nao tem uma associacao ativa ao tenant ForgeOS."
    },
    googleDialogTitle: "Início de sessão Google (versão alojada)",
    googleDialogBody:
      "OAuth Google requer Supabase Auth e configuração do fornecedor na versão alojada do ForgeOS. Após o login, o perfil é pré-preenchido pela associação ao workspace e conclui o onboarding da empresa e identidades de remetente.",
    microsoftDialogTitle: "Início de sessão Microsoft (versão alojada)",
    microsoftDialogBody:
      "OAuth Microsoft requer Supabase Auth e configuração do fornecedor na versão alojada do ForgeOS. Após o login, o perfil é pré-preenchido pela associação ao workspace e conclui o onboarding da empresa e identidades de remetente.",
    closeDialog: "Fechar"
  },
  authAccess: {
    signOut: "Terminar sessao",
    pending: {
      title: "Acesso a aguardar aprovacao",
      body: "A identidade esta autenticada, mas o ForgeOS nao encontrou uma associacao ativa a um tenant para esta conta. Peca a um administrador do workspace para aprovar o acesso antes de consultar dados do tenant."
    },
    denied: {
      title: "Acesso negado",
      body: "Esta conta esta suspensa ou revogada nas associacoes de tenant disponiveis. Os dados do tenant nao estao disponiveis nesta sessao."
    },
    tenants: {
      title: "Escolher workspace",
      body: "Esta conta tem acesso a mais do que um workspace ForgeOS. Escolha uma associacao de tenant para continuar.",
      select: "Selecionar"
    }
  },
  settings: {
    eyebrow: "Configuração do workspace",
    title: "Definições",
    description: "Configure marca da empresa, perfil, identidades de remetente, utilizadores de pré-visualização, integrações e cópia de segurança local.",
    loading: "A carregar definições…",
    save: "Guardar alterações",
    saving: "A guardar…",
    saved: "Definições guardadas.",
    saveFailed: "Falha ao guardar. Tente novamente.",
    sections: {
      company: "Empresa",
      profile: "O meu perfil",
      senders: "Identidades de remetente",
      team: "Equipa",
      integrations: "Integrações",
      backup: "Dados e cópia de segurança"
    },
    company: {
      legalName: "Nome legal",
      tradingName: "Nome comercial",
      vatNumber: "NIF",
      websiteUrl: "URL do website",
      generalEmail: "Email geral",
      generalPhone: "Telefone geral",
      addressLine1: "Morada linha 1",
      addressLine2: "Morada linha 2",
      postalCode: "Código postal",
      city: "Cidade",
      region: "Distrito",
      country: "País",
      logoPublicUrl: "URL pública do logótipo (HTTPS)",
      linkedinUrl: "URL LinkedIn",
      facebookUrl: "URL Facebook",
      legalFooter: "Rodapé legal",
      uploadLogo: "Carregar logótipo",
      removeLogo: "Remover logótipo",
      noLogo: "Sem logótipo",
      logoUploaded: "Logótipo carregado.",
      invalidWebsite: "URL do website inválido."
    },
    profile: {
      fullName: "Nome completo",
      jobTitle: "Cargo",
      email: "Email",
      phone: "Telefone",
      language: "Idioma",
      role: "Função"
    },
    senders: {
      add: "Adicionar identidade",
      created: "Identidade de remetente criada.",
      saved: "Identidade de remetente guardada.",
      defaultBadge: "Predefinida",
      inactive: "Inativa",
      preview: "Pré-visualizar assinatura",
      setDefault: "Definir como predefinida",
      archive: "Arquivar",
      archived: "Identidade arquivada.",
      signaturePreview: "Pré-visualização da assinatura",
      displayName: "Nome do remetente",
      fromEmail: "Email de envio",
      replyToEmail: "Email de resposta",
      phone: "Telefone",
      jobTitle: "Cargo"
    },
    team: {
      notice:
        "Utilizadores de pré-visualização local são guardados apenas no IndexedDB. Não são contas cloud autenticadas nem ligam ao Google ou Microsoft.",
      add: "Adicionar utilizador de pré-visualização",
      added: "Utilizador de pré-visualização adicionado.",
      localPreview: "Utilizador de pré-visualização local",
      active: "Ativo",
      inactive: "Inativo"
    },
    integrations: {
      diagnostic: "Executar diagnóstico",
      statuses: {
        configured: "Configurado",
        "not-configured": "Não configurado",
        "local-only": "Apenas local",
        "hosted-feature": "Funcionalidade da versão alojada",
        unavailable: "Indisponível"
      },
      provider: {
        title: "Fornecedor de envio de email",
        description: "Estado server-side para emails de teste protegidos em outreach. Segredos nunca aparecem no browser.",
        refresh: "Atualizar estado do fornecedor",
        loading: "A carregar estado do fornecedor...",
        unavailable: "Estado do fornecedor indisponivel.",
        provider: "Fornecedor",
        configured: "Configurado",
        realSend: "Protecao de envio real",
        testSend: "Protecao de envio de teste",
        apiKey: "Chave API presente",
        sender: "Remetente configurado",
        allowlist: "Destinatarios de teste permitidos",
        yes: "Sim",
        no: "Nao",
        missing: "Em falta",
        warnings: "Avisos"
      }
    },
    backup: {
      description: "Exporte ou importe uma cópia JSON dos dados locais do ForgeOS, incluindo perfis e imagens opcionais.",
      export: "Exportar cópia JSON",
      import: "Importar cópia JSON",
      exported: "Cópia de segurança descarregada.",
      imported: "Cópia de segurança restaurada.",
      invalid: "Ficheiro de cópia inválido."
    }
  },
  leadops: {
    eyebrow: "Contactos comerciais outbound",
    title: "Contactos Comerciais",
    description:
      "Reveja leads importados, progresso de campanhas e estado de outreach para o tenant demo. Os dados são sintéticos e isolados por tenant.",
    backToDashboard: "Voltar aos Contactos Comerciais",
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
    detailDescription: "Workspace de contacto comercial para gerar, rever, aprovar e simular envio de mensagens.",
    detailPlaceholder: "Compositor de email, linha temporal e atribuição a campanhas.",
    sections: {
      kpis: "KPIs de outreach",
      campaigns: "Resumo de campanhas",
      activity: "Atividade recente",
      leads: "Lista de leads",
      import: "Importar CSV/XLSX"
    },
    actions: {
      createLead: "Novo lead",
      convert: "Converter em cliente"
    },
    form: {
      createTitle: "Criar lead",
      companyName: "Empresa",
      contactName: "Contacto",
      email: "Email",
      required: "Empresa e contacto são obrigatórios.",
      invalidEmail: "Introduza um endereço de email válido."
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
      region: "Região",
      country: "País",
      all: "Todos"
    },
    management: {
      importHistory: "Histórico de importações",
      noImportHistory: "Ainda não existem importações registadas.",
      createCampaignFromFilters: "Criar campanha a partir dos filtros",
      createCampaignFromSelection: "Criar campanha a partir da seleção",
      viewCampaigns: "Ver campanhas",
      clearSelection: "Limpar seleção",
      category: "Categoria",
      region: "Região",
      sourceImport: "Importação de origem",
      emailValidity: "Validade do email",
      emailValidityValues: {
        valid: "Válido",
        missing: "Em falta",
        invalid: "Inválido"
      },
      suppressionStatus: "Supressão",
      suppressionValues: {
        none: "Nenhuma",
        unsubscribed: "Cancelou subscrição",
        bounced: "Rejeitado"
      },
      lastContacted: "Último contacto",
      campaignCount: "Campanhas",
      neverContacted: "Nunca contactado",
      neverContactedOnly: "Apenas nunca contactados",
      sendability: "Enviabilidade",
      sendabilityValues: {
        sendable: "Pronto para outreach",
        blocked: "Bloqueado"
      },
      importSummary: {
        selectBatch: "Selecione uma importação para ver o resumo.",
        status: "Estado",
        rows: "Total de linhas",
        organizations: "Organizações importadas",
        contacts: "Contactos importados",
        duplicates: "Duplicados ignorados",
        invalid: "Linhas inválidas",
        profile: "Perfil de mapeamento",
        sheet: "Folha",
        linkedLeads: "Organizações ligadas"
      },
      pageLabel: "Página {page} de {pages}",
      previousPage: "Anterior",
      nextPage: "Seguinte"
    },
    segmentation: {
      createTitle: "Criar segmento de campanha",
      createDescription: "Revise contactos correspondentes, destinatários enviáveis e exclusões antes de congelar o snapshot.",
      matchingOrganizations: "Organizações correspondentes",
      matchingContacts: "Contactos correspondentes",
      sendableRecipients: "Destinatários enviáveis",
      exclusionsTitle: "Exclusões",
      exclusions: {
        missingEmail: "Email em falta",
        invalidEmail: "Email inválido",
        suppressed: "Suprimidos",
        duplicate: "Contactos duplicados",
        inactive: "Inativos"
      },
      campaignName: "Nome da campanha",
      campaignDescription: "Descrição (opcional)",
      reviewDefinition: "Rever definição do segmento",
      nameRequired: "O nome da campanha é obrigatório.",
      createFailed: "Não foi possível criar a campanha.",
      creating: "A criar…",
      confirmCreate: "Criar campanha"
    },
    campaigns: {
      eyebrow: "Gestão de campanhas",
      listTitle: "Campanhas de outreach",
      listDescription: "Campanhas em rascunho e operacionais com snapshots de destinatários congelados.",
      backToList: "Voltar à lista de campanhas",
      name: "Nome",
      status: "Estado",
      createdAt: "Criada",
      recipientCount: "Destinatários",
      sendableCount: "Enviáveis",
      language: "Idioma",
      deliveryMode: "Modo de entrega",
      deliveryModes: {
        simulation: "Simulação",
        provider_handoff: "Entrega via fornecedor"
      },
      metadataTitle: "Metadados da campanha",
      noDescription: "Sem descrição.",
      snapshotCreated: "Snapshot criado",
      exclusionsTitle: "Exclusões do snapshot",
      excludedCount: "{count} destinatários excluídos no snapshot",
      segmentDefinitionTitle: "Definição do segmento",
      snapshotTitle: "Snapshot de destinatários",
      refreshRecipients: "Atualizar destinatários",
      confirmRefresh: "Confirmar atualização",
      refreshSummary: "Adicionados {added}, removidos {removed}, novos suprimidos {suppressed}, novos inválidos {invalid}.",
      inclusionReason: "Motivo de inclusão",
      recipientStatus: "Estado",
      includedCount: "{count} destinatários incluídos",
      nextStepTemplate: "Modelo de email (Passo 3)",
      nextStepTemplateHint: "A seleção e pré-visualização de modelos será implementada no próximo passo de outreach.",
      nextStepDrafts: "Rascunhos de mensagens (Passo 3)",
      nextStepDraftsHint: "A geração e aprovação de rascunhos será implementada no próximo passo de outreach.",
      templates: {
        title: "Modelo de email",
        description: "Edite o assunto e o corpo em texto simples. As variáveis são preenchidas a partir dos snapshots e das Definições.",
        subjectLabel: "Modelo de assunto",
        bodyLabel: "Modelo de corpo (texto simples)",
        variablesTitle: "Variáveis disponíveis",
        saveTemplate: "Guardar modelo",
        saving: "A guardar…",
        templateSaved: "Modelo guardado.",
        previewSample: "Pré-visualizar exemplo",
        previewTitle: "Pré-visualização de exemplo",
        templateVersion: "Versão do modelo {version}",
        senderIncomplete: "Identidade de remetente incompleta nas Definições: {fields}. A aprovação ficará bloqueada até corrigir.",
        refreshSender: "Atualizar dados do remetente",
        refreshingSender: "A atualizar remetente…",
        senderRefreshed: "Dados do remetente atualizados ({count} rascunhos regenerados).",
        previewFieldsTitle: "Detalhes da personalização",
        previewGreeting: "Saudação",
        previewContact: "Nome do contacto",
        previewOrganization: "Organização",
        previewOrganizationDisplay: "Nome formal da organização",
        previewCategory: "Categoria localizada",
        previewSender: "Remetente",
        previewSubject: "Assunto",
        previewDemoWarning: "Valores demo detetados no remetente.",
        previewOrgAsContact: "A organização foi tratada como contacto.",
        previewUntranslatedCategory: "Categoria não traduzida no rascunho.",
        greetingOverride: "Saudação manual",
        organizationDisplayOverride: "Nome formal manual",
        applyPersonalization: "Aplicar personalização",
        includedRecipients: "Destinatários incluídos",
        unresolvedCount: "Variáveis de modelo por resolver",
        htmlPreview: "Pré-visualização HTML"
      },
      drafts: {
        title: "Rascunhos personalizados",
        description: "Gere rascunhos determinísticos para destinatários incluídos. Rascunhos editados são ignorados na regeneração em massa.",
        generateAll: "Gerar rascunhos",
        generating: "A gerar…",
        generateSummary: "Gerados {generated} rascunhos ({skipped} editados ignorados, {needsReview} precisam de revisão).",
        filterLabel: "Filtrar",
        filterAll: "Todos",
        pending: "Pendentes",
        drafted: "Rascunhados",
        needsReview: "Precisam de revisão",
        edited: "Editados",
        unresolved: "Variáveis por resolver",
        countSummary: "{drafted} rascunhados · {edited} editados",
        statusColumn: "Estado do rascunho",
        subjectColumn: "Assunto",
        statuses: {
          PENDING: "Pendente",
          DRAFTED: "Rascunhado",
          NEEDS_REVIEW: "Precisa de revisão",
          APPROVED: "Aprovado",
          EXCLUDED: "Excluído",
          OPENED_EXTERNALLY: "Aberto externamente",
          SENT_MANUALLY: "Enviado manualmente",
          DELIVERED: "Entregue",
          SOFT_BOUNCED: "Bounce temporario",
          HARD_BOUNCED: "Bounce definitivo",
          COMPLAINED: "Reclamacao",
          UNSUBSCRIBED: "Cancelado",
          DELIVERY_FAILED: "Falha de entrega",
          DEFERRED: "Adiado",
          SKIPPED: "Ignorado",
          SUPPRESSED: "Suprimido"
        },
        editedBadge: "Editado",
        editorTitle: "Editar rascunho",
        unresolvedWarning: "Este rascunho contém variáveis por resolver e não pode ser aprovado até ser corrigido.",
        saveDraft: "Guardar rascunho",
        saving: "A guardar…",
        draftSaved: "Rascunho guardado.",
        regenerateOne: "Regenerar a partir do modelo",
        confirmRegenerate: "Substituir edições manuais",
        regenerated: "Rascunho regenerado a partir do modelo."
      },
      review: {
        title: "Rever e enviar",
        description: "Aprove rascunhos seguros, abra Gmail ou Outlook e confirme o envio manual após entrega fora do ForgeOS.",
        approveOne: "Aprovar rascunho",
        bulkApproveSafe: "Aprovar todos os rascunhos seguros",
        bulkSummary: "Aprovados {approved} rascunhos; ignorados {skipped} destinatários inseguros.",
        unsafeReasons: "Não pode aprovar",
        blockReasons: {
          missing_email: "email em falta",
          invalid_email: "email inválido",
          suppressed: "contacto suprimido",
          no_draft: "sem rascunho gerado",
          needs_review: "precisa de revisão",
          missing_subject: "assunto em falta",
          missing_body: "corpo em falta",
          unresolved_variables: "variáveis por resolver",
          sender_incomplete: "identidade de remetente incompleta",
          missing_opt_out: "instrução de cancelamento em falta",
          campaign_locked: "campanha não editável",
          already_sent: "já enviado",
          not_approved: "não aprovado",
          approval_stale: "aprovação desatualizada"
        },
        approved: "Rascunho aprovado.",
        openedExternal: "Compose externo aberto. A mensagem ainda não foi marcada como enviada.",
        openedExternalStatus: "Aberto externamente — não enviado",
        sentManualStatus: "Enviado manualmente",
        markSentExternally: "Marcar como enviado externamente",
        confirmSent: "Confirmar envio manual",
        confirmSentBody:
          "O ForgeOS não pode verificar independentemente a entrega. Confirme que enviou esta mensagem externamente.",
        operatorNote: "Nota do operador (opcional)",
        markedSent: "Marcado como enviado externamente.",
        simulateSend: "Simular envio",
        simulated: "Envio simulado registado (sem entrega externa).",
        invalidated: "Aprovação invalidada: {reason}",
        duplicateBlocked: "Envio duplicado bloqueado para este destinatário da campanha.",
        cooldownWarning: "Este contacto foi contactado recentemente. A anulação requer confirmação e motivo.",
        cooldownOverride: "Anular cooldown de contacto recente",
        protectedTestTitle: "Envio de teste protegido Brevo",
        protectedTestDescription:
          "Envie exatamente um email de teste interno para um endereço autorizado. O lead original nunca é contactado e o destinatário não é marcado como enviado.",
        protectedTestRecipient: "Destinatário de teste autorizado",
        protectedTestConfirmation: "Escreva SEND TEST para confirmar",
        protectedTestConfirmationHint: "Frase de confirmação obrigatória: SEND TEST",
        protectedTestSend: "Enviar email de teste protegido",
        protectedTestSending: "A enviar teste protegido…",
        protectedTestUnavailable: "O envio de teste protegido Brevo não está configurado no servidor.",
        protectedTestSuccess: "Email de teste protegido aceite pela Brevo.",
        protectedTestAlreadyProcessed: "Este teste protegido já foi enviado para o mesmo conteúdo aprovado.",
        protectedTestBlocked: "Envio de teste protegido bloqueado pelas proteções do servidor.",
        protectedTestFailed: "Falha no envio de teste protegido.",
        protectedTestPreviewHtml: "Pré-visualização HTML",
        protectedTestPreviewPlain: "Pré-visualização texto simples"
      },
      progress: {
        title: "Progresso da campanha",
        total: "Incluídos",
        drafted: "Rascunhados",
        needsReview: "Precisam de revisão",
        approved: "Aprovados",
        openedExternally: "Abertos externamente",
        manuallySent: "Enviados manualmente",
        excluded: "Excluídos",
        suppressed: "Suprimidos",
        skipped: "Ignorados"
      },
      workflow: {
        navLabel: "Fluxo da campanha",
        stepNumber: "Passo {number}",
        steps: {
          draft: "Rascunhar emails",
          approve: "Aprovar rascunhos",
          queue: "Colocar em fila",
          delivery: "Fila de envio / estado de entrega"
        }
      },
      advanced: {
        title: "Avançado / detalhes da campanha",
        show: "Mostrar detalhes",
        hide: "Ocultar detalhes",
        segmentHint:
          "A definição de segmento é informativa neste MVP. Crie segmentos no painel LeadOps."
      }
    },
    providerEvents: {
      title: "Eventos do fornecedor",
      description: "Eventos recentes de entrega, bounce, reclamacao, cancelamento e desconhecidos com metadados sanitizados.",
      empty: "Ainda nao ha eventos do fornecedor.",
      eventType: "Evento",
      status: "Processamento",
      effect: "Efeito",
      receivedAt: "Recebido",
      message: "Mensagem"
    },
    sendJobs: {
      title: "Envio da campanha (simulacao local)",
      description:
        "Coloque destinatarios aprovados numa tarefa de simulacao local em IndexedDB e processe um lote limitado de cada vez. Nao envia email real.",
      simulationBanner: "Apenas simulacao local. Este percurso nao usa o armazenamento duravel de producao.",
      productionIncomplete: "Armazenamento duravel de producao incompleto. Tarefas Brevo continuam desativadas.",
      brevoDisabled: "Envio Brevo de producao desativado ate a persistencia alojada e rotas de servidor estarem concluidas.",
      empty: "Ainda nao existe tarefa de envio para esta campanha.",
      queueSimulation: "Criar fila de simulacao",
      processNextBatch: "Processar proximo lote",
      pause: "Pausar",
      resume: "Retomar",
      cancel: "Cancelar por enviar",
      status: "Estado",
      mode: "Modo",
      provider: "Fornecedor",
      batchSize: "Tamanho do lote",
      dailyUsage: "Uso diario",
      processed: "Processados",
      sent: "Enviados",
      failed: "Falhados",
      retryPending: "Retry pendente",
      skipped: "Ignorados",
      remaining: "Restantes",
      lock: "Bloqueio",
      lastProcessed: "Ultimo processamento",
      queued: "Em fila",
      processing: "Em processamento",
      completed: "Concluida",
      paused: "Pausada",
      cancelled: "Cancelada",
      confirmationRequired: "Apenas campanhas aprovadas podem entrar em fila. A simulacao continua predefinida.",
      confirmPause: "Pausar esta tarefa de simulacao? Os destinatarios por enviar ficam em fila ate retomar.",
      confirmCancel: "Cancelar destinatarios por enviar nesta tarefa de simulacao? O historico enviado e preservado.",
      alreadyQueued: "Ja em fila",
      queuedSimulationJob: "Tarefa de simulacao criada",
      pausedResult: "Pausada",
      resumedResult: "Retomada",
      cancelledResult: "Cancelada",
      result: "Ultimo resultado",
      localMvpNotice:
        "No MVP local, a fila só corre enquanto o ForgeOS/servidor de desenvolvimento estiver ativo. Em produção, isto deve correr através de um worker de servidor, cron ou n8n.",
      intervalMinutes: "Intervalo (minutos)",
      autoProcessingHint:
        "O processamento da fila corre automaticamente enquanto esta página estiver aberta e o servidor de desenvolvimento ativo. Use os controlos manuais se necessário.",
      queueSend: {
        stepLabel: "Passo 3",
        title: "Colocar envio em fila",
        description:
          "Coloque rascunhos aprovados na tarefa de simulação local com tamanho de lote e intervalo entre emails.",
        localMvpNotice:
          "No MVP local, a fila só corre enquanto o ForgeOS/servidor de desenvolvimento estiver ativo. Em produção, isto deve correr através de um worker de servidor, cron ou n8n.",
        realSendDisabledWarning:
          "O envio real de campanha permanece desativado a menos que OUTREACH_REAL_SEND_ENABLED=true. O modo de auto-teste usa OUTREACH_TEST_SEND_ENABLED=true e não contacta destinatários da campanha.",
        batchSize: "Tamanho do lote",
        intervalMinutes: "Intervalo entre emails (minutos)",
        intervalError: "O intervalo deve estar entre 0 e 60 minutos.",
        startTime: "Hora de início",
        startNow: "Iniciar agora",
        startScheduled: "Agendar hora local",
        scheduleError: "Introduza uma data e hora local válidas.",
        safetyTitle: "Resumo de segurança da fila",
        approvedDrafts: "{count} rascunhos aprovados na campanha",
        eligibleRecipients: "{count} destinatários elegíveis para fila",
        excludedRecipients: "{count} destinatários excluídos da fila",
        needsApproval: "Aprove todos os rascunhos antes de colocar em fila.",
        refreshEligibility: "Atualizar elegibilidade",
        queueAction: "Colocar rascunhos aprovados em fila",
        queueing: "A colocar em fila…",
        queued: "Fila de envio criada",
        notEligible: "A campanha não é elegível para fila.",
        queueFailed: "Não foi possível colocar a campanha em fila."
      },
      hostedPreparation: {
        title: "Preparacao para envio no servidor",
        description:
          "Prepara a fotografia aprovada da campanha para simulacao duravel alojada. Nao envia email nem ativa envio Brevo.",
        prepare: "Preparar para envio no servidor",
        preparing: "A preparar...",
        refresh: "Atualizar estado preparado",
        tenant: "Tenant",
        noTenants: "Sem membership de tenant confiavel",
        approvalState: "Aprovacao",
        approvedRecipients: "Destinatarios aprovados",
        staleApprovals: "Aprovacoes desatualizadas",
        status: "Estado preparado",
        eligibility: "Elegibilidade",
        eligible: "Pronto para preparar",
        notEligible: "Nao esta pronto",
        needsApproval: "A campanha tem de estar aprovada antes da preparacao.",
        hasStaleApprovals: "Resolva aprovacoes desatualizadas antes da preparacao.",
        emptySnapshot: "E necessario pelo menos um destinatario incluido e aprovado.",
        preparedAt: "Preparado em",
        preparedBy: "Preparado por",
        audit: "Auditoria alojada recente",
        authUnavailable: "Autenticacao alojada ou membership de tenant indisponivel nesta sessao local.",
        statusFailed: "Nao foi possivel carregar o estado preparado.",
        prepareFailed: "A preparacao da campanha falhou. Nenhum email foi enviado.",
        senderIncomplete: "Empresa ou identidade de remetente incompleta.",
        createdPrepared: "{count} destinatarios preparados para simulacao duravel alojada.",
        reusedPrepared: "Ja estava preparado. A fotografia alojada existente foi reutilizada.",
        states: {
          failed: "Falhou",
          loading: "A carregar",
          not_prepared: "Nao preparado",
          prepared: "Preparado",
          preparing: "A preparar",
          stale: "Fotografia desatualizada / invalida"
        }
      }
    },
    suppression: {
      title: "Lista de supressão",
      description: "Emails bloqueados não podem ser aprovados, abertos no Gmail/Outlook ou marcados como enviados até remoção permitida.",
      emailPlaceholder: "Email a suprimir",
      notesPlaceholder: "Notas (opcional)",
      searchPlaceholder: "Pesquisar emails suprimidos",
      allReasons: "Todos os motivos",
      allSources: "Todas as origens",
      add: "Adicionar supressão",
      remove: "Remover",
      created: "Supressão adicionada.",
      removed: "Supressão removida.",
      error: "Falha na ação de supressão.",
      removeConfirm: "Remover supressão de {email}?",
      elevatedRequired: "Este motivo requer permissão elevada, confirmação e motivo documentado de remoção.",
      elevatedConfirmLabel: "Confirmo remoção elevada",
      removalReasonPlaceholder: "Motivo da remoção",
      confirmRemove: "Confirmar remoção",
      viewContact: "Ver contacto",
      viewCampaign: "Ver campanha",
      reasons: {
        manual: "Manual",
        unsubscribe: "Cancelamento",
        hard_bounce: "Bounce definitivo",
        complaint: "Reclamacao",
        invalid_address: "Endereço inválido",
        duplicate: "Duplicado",
        legal_request: "Pedido legal",
        other: "Outro"
      },
      sources: {
        operator: "Operador",
        import: "Importação",
        campaign: "Campanha",
        lead_detail: "Detalhe do lead",
        provider_webhook: "Webhook do fornecedor",
        public_unsubscribe: "Cancelamento publico",
        system: "Sistema"
      },
      columns: {
        email: "Email",
        reason: "Motivo",
        source: "Origem",
        createdAt: "Criado",
        actions: "Ações"
      }
    },
    operationalSummary: {
      title: "Resumo operacional de outreach",
      description: "Métricas locais reais de leads importados, campanhas e envios manuais. Sem métricas de entrega de fornecedor.",
      metrics: {
        importedOrganizations: "Organizações importadas",
        validContacts: "Contactos válidos",
        invalidOrMissingEmailContacts: "Email inválido/ausente",
        draftCampaigns: "Campanhas em rascunho",
        draftsAwaitingReview: "Rascunhos por rever",
        approvedRecipients: "Destinatários aprovados",
        openedExternally: "Abertos externamente",
        manuallySent: "Enviados manualmente",
        suppressed: "Emails suprimidos",
        recentWarnings: "Avisos recentes"
      }
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
    import: {
      chooseCsv: "Escolher CSV",
      chooseFile: "Escolher CSV ou XLSX",
      description:
        "Carregue uma base de contactos (CSV ou XLSX), reveja o mapeamento e a validação, e confirme para gravar organizações e contactos.",
      duplicateEmails: "Emails duplicados",
      duplicateRows: "Emails duplicados",
      invalidRows: "Inválidos",
      reviewRows: "Revisão",
      validRows: "Válidos",
      totalRows: "Total de linhas",
      possibleDuplicates: "Possíveis duplicados",
      missingEmailRows: "Sem email",
      confirmImport: "Confirmar importação",
      importing: "A importar…",
      summary: "Importados {imported} leads. Ignorados {skipped} duplicados.",
      failed: "A importação falhou.",
      fileHint: "Máx. 5 MB. Suporta CSV e XLSX.",
      mappingTitle: "Mapeamento de campos",
      unmapped: "Não mapeado",
      cancel: "Cancelar",
      continuePreview: "Continuar para pré-visualização",
      repeatImportWarning: "Este ficheiro corresponde a uma importação concluída anteriormente.",
      repeatImportConfirm: "Permitir reimportação",
      filterStatus: "Filtrar",
      filterAll: "Todas as linhas",
      copyErrors: "Copiar resumo de erros",
      attachStrongDuplicates: "Anexar novos dados a correspondências organizacionais fortes",
      approvePossible: "Aprovar",
      backToMapping: "Voltar ao mapeamento",
      retryMapping: "Aplicar alterações de mapeamento",
      importAnother: "Importar outro ficheiro",
      messages: "Mensagens",
      selectSheet: "Folha de cálculo",
      mappingProfile: "Perfil de mapeamento",
      saveProfile: "Guardar perfil",
      saveProfilePlaceholder: "Nome do perfil",
      profileSaved: "Perfil de mapeamento guardado.",
      deleteProfile: "Eliminar",
      deleteProfileConfirm: "Eliminar perfil de mapeamento \"{label}\"?",
      warningsFilter: "Avisos",
      showNormalized: "Mostrar valores normalizados",
      downloadErrors: "Transferir relatório de erros",
      fields: {
        companyName: "Nome da empresa",
        contactName: "Pessoa de contacto",
        email: "Email",
        phone: "Telefone",
        website: "Website",
        region: "Região",
        country: "País",
        industry: "Categoria",
        notes: "Notas",
        sourceDatabase: "Origem",
        status: "Estado",
        language: "Idioma"
      }
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
    industries: {
      Hospitality: "Hotelaria",
      Events: "Eventos",
      "Food & Beverage": "Restauração e bebidas",
      Packaging: "Embalagem",
      "Sports venues": "Recintos desportivos"
    },
    campaignStatuses: {
      draft: "Rascunho",
      ready_for_review: "Pronta para revisão",
      approved: "Aprovada",
      in_progress: "Em progresso",
      completed: "Concluída",
      paused: "Em pausa",
      cancelled: "Cancelada",
      active: "Ativa"
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
      generationLoading: "A gerar...",
      subject: "Assunto",
      body: "Mensagem",
      method: "Método",
      providerMode: "Modo",
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
      generatedSuccess: "Email gerado e pronto para revisão.",
      generationError: "Não foi possível gerar o email. Tente novamente.",
      providerQueuedSuccess: "Mensagem submetida ao provider live e mantida como em fila.",
      sentSuccess: "Envio simulado concluído.",
      sending: "A enviar...",
      confirmSend: "Confirmar envio ou simulação desta mensagem?",
      deterministicMode: "Geração determinística",
      fallbackNotice:
        "Não foi possível utilizar o fornecedor de IA configurado. Foi utilizada a geração local.",
      modelLabel: "Modelo",
      liveAiMode: "IA configurada",
      simulationMode: "Modo de simulação",
      liveProviderMode: "Provider live",
      providerErrorMode: "Erro do provider",
      providerError: "O provider não concluiu o envio.",
      savedDraftLoaded: "Rascunho local restaurado.",
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
      leadNotFound: "Lead não encontrado na base de dados local.",
      manualProductReason: "Produto disponível para seleção manual.",
      senderIdentity: "Identidade de remetente",
      companyProfile: "Perfil da empresa",
      htmlPreview: "Pré-visualização HTML",
      plainPreview: "Pré-visualização em texto simples"
    },
    brandingPreview: {
      links: "Ligações verificadas",
      media: "Blocos de media",
      signature: "Assinatura",
      footer: "Rodapé legal"
    },
    copyActions: {
      copySubject: "Copiar assunto",
      copyPlain: "Copiar texto simples",
      copyFormatted: "Copiar email formatado",
      copyFull: "Copiar mensagem completa",
      openDefault: "Abrir aplicação de email",
      openGmail: "Abrir Gmail",
      openOutlook: "Abrir Outlook",
      copiedSubject: "Assunto copiado.",
      copiedPlain: "Texto simples copiado.",
      copiedFormatted: "Email formatado copiado.",
      copiedFull: "Mensagem completa copiada.",
      copyFailed: "Falha ao copiar.",
      htmlFallback: "(Clipboard HTML não suportado — foi copiado texto simples.)",
      localImageWarning:
        "Algumas imagens estão apenas em armazenamento local e não podem ser incorporadas em HTML externo. São necessários URLs HTTPS públicos para imagens destinadas ao destinatário.",
      mailtoTruncated: "O corpo da mensagem foi truncado devido ao limite do mailto.",
      bodyTruncated: "O corpo da mensagem foi truncado devido ao limite do cliente de email."
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
  dashboardCustomize: {
    title: "Personalizar painel",
    description: "Escolha painéis visíveis, densidade e intervalo de datas predefinido. As preferências ficam guardadas localmente.",
    panelsTitle: "Painéis",
    densityTitle: "Densidade",
    densityComfortable: "Confortável",
    densityCompact: "Compacta",
    dateRangeTitle: "Intervalo predefinido",
    dateToday: "Hoje",
    dateWeek: "Esta semana",
    dateMonth: "Este mês",
    restore: "Restaurar predefinições",
    save: "Guardar layout",
    close: "Fechar",
    panelLabels: {
      oee: "Produção OEE",
      inventory: "Resumo de inventário",
      alerts: "Alertas e atividades",
      productionOrders: "Encomendas de produção",
      revenue: "Receita",
      copilot: "Copiloto IA",
      marketing: "Resumo de marketing",
      onboarding: "Checklist de onboarding"
    }
  },
  dashboardModule: {
    subtitle: "Métricas em tempo real da base de dados local ForgeOS",
    recentActivity: "Atividade recente",
    noActivity: "Ainda sem atividade. Execute o fluxo demo ou importe leads para criar registos.",
    noInventory: "Ainda sem inventário. Itens de pré-visualização são mostrados até existir stock.",
    leadopsHint: "Contactos comerciais e campanhas de email",
    openOutreach: "Abrir Contactos Comerciais",
    revenueTitle: "Receita",
    revenueEstimated: "Estimada a partir de orçamentos locais quando existirem; caso contrário tendência demo.",
    copilotDisclaimer: "O copiloto fornece apenas respostas determinísticas de pré-visualização. Ainda não executa ações operacionais.",
    copilotSend: "Enviar",
    copilotPrompts: {
      molds: "Quais moldes precisam de manutenção no próximo mês?",
      delayedOrders: "Quais encomendas estão em atraso?",
      lowStock: "Que produtos estão abaixo do stock mínimo?",
      quotations: "Quais orçamentos aguardam resposta?",
      campaigns: "Que campanhas de marketing precisam de aprovação?"
    },
    kpi: {
      oee: "Produção OEE",
      revenue: "Receita (semana)",
      openQuotations: "Orçamentos abertos",
      delayedOrders: "Encomendas em atraso",
      maintenanceAlerts: "Alertas de manutenção"
    },
    marketing: {
      title: "Marketing e Outreach",
      leadsReady: "Leads prontos",
      drafts: "Rascunhos por rever",
      approved: "Emails aprovados",
      opened: "Abertos externamente",
      suppressed: "Leads suprimidos",
      openOutreach: "Abrir Contactos Comerciais",
      openMarketing: "Abrir Marketing"
    },
    metrics: {
      leads: "Total de leads",
      qualified: "Leads qualificados",
      customers: "Clientes",
      opportunities: "Oportunidades ativas",
      quotations: "Orçamentos abertos",
      production: "Ordens de produção",
      outreachReady: "Outreach prontos",
      outreachSent: "Outreach contactados"
    }
  },
  customersModule: {
    title: "Clientes",
    description: "Gerir clientes do tenant com criar, editar e arquivar.",
    loading: "A carregar clientes…",
    empty: "Ainda sem clientes",
    emptyDescription: "Crie um cliente ou converta um lead em Contactos Comerciais.",
    actions: { create: "Novo cliente" },
    form: {
      createTitle: "Criar cliente",
      editTitle: "Editar cliente",
      companyName: "Empresa",
      contactName: "Contacto",
      email: "Email",
      phone: "Telefone",
      notes: "Notas",
      required: "Empresa e contacto são obrigatórios.",
      invalidEmail: "Introduza um endereço de email válido."
    },
    table: {
      company: "Empresa",
      contact: "Contacto",
      email: "Email",
      sourceLead: "Lead de origem",
      opportunities: "Oportunidades",
      created: "Criado"
    }
  },
  machinesModule: {
    title: "Máquinas",
    description: "Gerir máquinas de produção, capacidade e disponibilidade.",
    loading: "A carregar máquinas…",
    empty: "Ainda sem máquinas.",
    actions: { create: "Nova máquina" },
    statuses: {
      operational: "Operacional",
      maintenance: "Manutenção",
      offline: "Offline",
      retired: "Retirada"
    },
    form: {
      createTitle: "Criar máquina",
      editTitle: "Editar máquina",
      code: "Código",
      name: "Nome",
      type: "Tipo",
      status: "Estado",
      capacity: "Capacidade / hora",
      location: "Localização",
      notes: "Notas",
      required: "Código e nome são obrigatórios."
    },
    table: {
      code: "Código",
      name: "Nome",
      type: "Tipo",
      status: "Estado",
      capacity: "Capacidade/h"
    }
  },
  inventoryModule: {
    title: "Inventário",
    description: "Acompanhar níveis de stock, entradas e localizações.",
    loading: "A carregar inventário…",
    empty: "Ainda sem itens de inventário.",
    actions: { create: "Novo item", receiveStock: "Registar entrada" },
    form: {
      createTitle: "Criar item de inventário",
      editTitle: "Editar item de inventário",
      sku: "SKU",
      name: "Nome",
      category: "Categoria",
      unit: "Unidade",
      reorderLevel: "Nível de reposição",
      location: "Localização no armazém",
      notes: "Notas",
      required: "SKU e nome são obrigatórios."
    },
    stock: {
      title: "Registar entrada de stock",
      quantity: "Quantidade",
      reason: "Motivo",
      submit: "Registar entrada",
      defaultReason: "Entrada manual"
    },
    table: {
      sku: "SKU",
      name: "Nome",
      quantity: "Quantidade",
      unit: "Unidade",
      location: "Localização"
    }
  },
  crudModule: {
    searchPlaceholder: "Pesquisar registos…",
    showArchived: "Mostrar arquivados",
    actions: {
      menu: "Ações",
      edit: "Editar",
      archive: "Arquivar",
      restore: "Restaurar",
      duplicate: "Duplicar"
    },
    form: {
      create: "Criar",
      save: "Guardar",
      cancel: "Cancelar"
    },
    archive: {
      title: "Arquivar registo?",
      message: "Registos arquivados ficam ocultos nas listas por defeito. Pode restaurá-los mais tarde.",
      restoreMessage: "Restaurar este registo para as listas ativas?",
      confirm: "Confirmar",
      cancel: "Cancelar"
    },
    error: { generic: "Ocorreu um erro. Tente novamente." },
    rolePreview: {
      badge: "Papel (pré-visualização)",
      label: "Papel de pré-visualização",
      roles: {
        owner: "Proprietário",
        sales: "Comercial",
        production_manager: "Gestor de produção",
        warehouse_manager: "Gestor de armazém"
      }
    },
    commandPalette: {
      placeholder: "Pesquisar módulos e registos…",
      noResults: "Sem resultados",
      close: "Fechar",
      groups: {
        navigation: "Navegação",
        create: "Criação rápida",
        leads: "Leads",
        customers: "Clientes",
        products: "Produtos",
        quotes: "Orçamentos",
        production: "Produção",
        machines: "Máquinas",
        inventory: "Inventário"
      },
      create: {
        lead: "Novo lead",
        customer: "Novo cliente",
        product: "Novo produto",
        quote: "Novo orçamento",
        customizer: "Nova simulação de copos",
        production: "Nova ordem de produção",
        machine: "Nova máquina",
        inventory: "Novo item de inventário"
      }
    },
    quickCreate: {
      trigger: "Criar",
      lead: "Lead",
      customer: "Cliente",
      product: "Produto",
      quote: "Orçamento",
      customizer: "Personalizador de copos",
      production: "Ordem de produção",
      machine: "Máquina",
      inventory: "Item de inventário"
    },
    customizeDialog: {
      title: "Personalizar painel",
      message: "A personalização do painel não está disponível nesta pré-visualização MVP local.",
      close: "Fechar"
    }
  },
  quotationsModule: {
    title: "Orçamentos",
    description: "Criar, aprovar e gerir orçamentos de clientes.",
    loading: "A carregar orçamentos…",
    empty: "Ainda sem orçamentos.",
    tabs: {
      label: "Navegação de orçamentos",
      quotations: "Orçamentos",
      customizer: "Personalizador de Copos"
    },
    actions: { create: "Novo orçamento", approve: "Aprovar" },
    form: {
      createTitle: "Criar orçamento",
      customer: "Cliente",
      product: "Produto",
      quantity: "Quantidade",
      printColors: "Cores de impressão",
      notes: "Notas",
      selectCustomer: "Selecionar cliente",
      selectProduct: "Selecionar produto",
      required: "Cliente e produto são obrigatórios."
    },
    statuses: {
      draft: "Rascunho",
      sent: "Enviado",
      approved: "Aprovado",
      rejected: "Rejeitado"
    },
    table: {
      number: "Número",
      customer: "Cliente",
      product: "Produto",
      quantity: "Quantidade",
      status: "Estado",
      source: "Origem",
      total: "Total",
      created: "Criado",
      manual: "Manual",
      fromCustomizer: "Personalizador",
      fromCustomizerEstimate: "Personalizador (estimativa)"
    }
  },
  productionModule: {
    title: "Ordens de produção",
    description: "Atribuir máquinas, atualizar estado e abrir cartões de trabalho.",
    loading: "A carregar ordens…",
    empty: "Ainda sem ordens de produção.",
    openJobCard: "Cartão de trabalho",
    actions: {
      assignMachine: "Atribuir máquina",
      start: "Iniciar produção",
      complete: "Marcar concluída"
    },
    form: {
      assignMachine: "Atribuir máquina",
      machine: "Máquina",
      selectMachine: "Selecionar máquina"
    },
    statuses: {
      scheduled: "Agendado",
      "in-progress": "Em curso",
      blocked: "Bloqueado",
      completed: "Concluído"
    },
    table: {
      number: "Ordem",
      customer: "Cliente",
      product: "Produto",
      quantity: "Quantidade",
      machine: "Máquina",
      status: "Estado",
      created: "Criado"
    }
  },
  jobCard: {
    backToProduction: "Voltar à produção",
    notFound: "Ordem de produção não encontrada na base de dados local.",
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
  },
  customizerModule: {
    title: "Personalizador de Copos",
    description: "Configure copos, pré-visualize arte e gere orçamentos estimados.",
    loading: "A carregar personalizador…",
    emptyProducts: "Sem produtos de copos no catálogo. Adicione copos personalizáveis primeiro.",
    emptySimulations: "Ainda sem simulações guardadas.",
    sections: {
      context: "Cliente e produto",
      configuration: "Configuração",
      artwork: "Arte",
      simulations: "Simulações guardadas",
      pricing: "Estimativa de preço"
    },
    form: {
      customer: "Cliente",
      lead: "Lead",
      product: "Produto",
      quantity: "Quantidade",
      material: "Material",
      cupSize: "Tamanho do copo",
      cupType: "Tipo de copo",
      printColors: "Cores de impressão",
      printArea: "Área de impressão",
      artworkPosition: "Posição da arte",
      artworkScale: "Escala da arte",
      artworkOffsetX: "Desvio horizontal",
      artworkOffsetY: "Desvio vertical",
      artworkRotation: "Rotação da arte",
      deliveryDate: "Data de entrega desejada",
      notes: "Notas",
      previewScene: "Ambiente",
      selectCustomer: "Selecionar cliente (opcional)",
      selectLead: "Selecionar lead (opcional)",
      required: "Selecione um produto de copo para continuar."
    },
    printAreas: { deg180: "180º", deg360: "360º" },
    cupTypes: { reusable_pp: "Copo reutilizável em PP", paper: "Copo de papel" },
    materials: { polypropylene: "Polipropileno (PP)", paper: "Papel" },
    artworkPositions: { left: "Esquerda", center: "Centro", right: "Direita" },
    artwork: {
      upload: "Carregar arte",
      useLogo: "Usar logótipo da empresa",
      useProductImage: "Usar imagem do produto",
      uploaded: "Arte carregada.",
      logoApplied: "Logótipo aplicado à pré-visualização.",
      productImageApplied: "Imagem do produto aplicada à pré-visualização.",
      noLogo: "Carregue primeiro o logótipo em Definições.",
      noProductImage: "Este produto não tem URL de imagem."
    },
    preview: {
      label: "Pré-visualização do copo",
      generate: "Gerar pré-visualização",
      generated: "Pré-visualização atualizada.",
      stale: "A configuração mudou — gere novamente a pré-visualização antes de guardar.",
      missingAsset: "Imagem modelo em falta; a mostrar modelo neutro.",
      brokenProductImage: "Imagem do produto indisponível; a usar modelo de copo.",
      sceneDay: "Dia",
      sceneNight: "Noite",
      legacyPaperWarning:
        "Esta simulação usava um copo de papel oculto nesta versão. Reveja a configuração antes de guardar.",
      metadata: {
        cupType: "Tipo de copo",
        cupSize: "Tamanho",
        printArea: "Área de impressão",
        quantity: "Quantidade",
        artwork: "Arte",
        scene: "Ambiente"
      },
      inkCoverage: "Cobertura estimada de tinta",
      inkCoverageTooltip:
        "Estimativa visual aproximada com base na opacidade da arte carregada. Não é uma medição final de consumo de tinta em produção."
    },
    pricing: {
      estimateBadge: "Estimativa",
      unitPrice: "Preço unitário",
      setupCost: "Setup",
      subtotal: "Subtotal",
      vat: "IVA",
      total: "Total",
      assumptions: "Pressupostos",
      manualOverride: "Preço unitário manual",
      overrideReason: "Motivo do ajuste",
      selectProduct: "Selecione um produto para calcular o preço."
    },
    actions: {
      save: "Guardar simulação",
      saved: "Simulação guardada.",
      convertToQuote: "Criar orçamento a partir da simulação",
      converted: "Orçamento criado.",
      newSimulation: "Nova simulação",
      resetView: "Repor vista",
      openCustomizer: "Abrir Personalizador de Copos",
      openInCustomizer: "Abrir no personalizador",
      customize: "Personalizar",
      openForCustomer: "Personalizar copos"
    },
    statuses: {
      draft: "Rascunho",
      saved: "Guardada",
      converted: "Convertida",
      archived: "Arquivada"
    },
    leadopsMedia: {
      title: "Mockup do personalizador",
      description: "Opcionalmente anexe um mockup do personalizador de copos no seguimento deste lead.",
      optIn: "Anexar mockup da simulação ao outreach (marcador de posição)",
      mockupPlaceholder: "Ainda sem mockup — abra o personalizador para criar uma simulação para este lead.",
      mockupReady: "Existe uma simulação com mockup associada a este lead.",
      openCustomizer: "Abrir Personalizador de Copos para este lead"
    }
  },
  onboardingModule: {
    title: "Primeiros passos",
    subtitle: "Conclua estes passos para validar o fluxo MVP local.",
    dismiss: "Dispensar",
    progress: "{completed} de {total} concluídos",
    items: {
      company_profile: "Completar perfil da empresa",
      company_logo: "Carregar logótipo",
      sender_identity: "Configurar remetente predefinido",
      abacus_configured: "Rever definições do fornecedor de IA",
      product_urls: "Adicionar URLs de produtos",
      product_image: "Adicionar imagens de produtos",
      leads_imported: "Importar ou criar leads",
      first_email: "Gerar primeiro email de outreach",
      first_quotation: "Criar primeiro orçamento",
      customizer_tested: "Testar Personalizador de Copos",
      backup_exported: "Exportar backup local"
    }
  },
  notificationsModule: {
    title: "Notificações",
    trigger: "Notificações",
    close: "Fechar notificações",
    loading: "A carregar…",
    empty: "Sem notificações",
    markAllRead: "Marcar todas como lidas"
  },
  hostedFeatures: {
    close: "Fechar",
    localMvpNote: "Estas capacidades requerem uma implementação alojada do ForgeOS. O MVP local usa IndexedDB e modos de simulação.",
    features: {
      google: {
        title: "Início de sessão Google",
        description: "Autenticar utilizadores com Google OAuth via Supabase Auth.",
        requirements: [
          "Configurar cliente OAuth no Google Cloud Console",
          "Ativar fornecedor Google no Supabase Auth",
          "Definir URLs de redirecionamento para o domínio de produção"
        ]
      },
      microsoft: {
        title: "Início de sessão Microsoft",
        description: "Autenticar utilizadores com Microsoft Entra ID via Supabase Auth.",
        requirements: [
          "Registar aplicação ForgeOS no Microsoft Entra ID",
          "Ativar fornecedor Microsoft no Supabase Auth",
          "Configurar inquilino e URIs de redirecionamento"
        ]
      },
      supabase: {
        title: "Sincronização Supabase",
        description: "Migrar persistência e autenticação para PostgreSQL alojado.",
        requirements: [
          "Definir NEXT_PUBLIC_SUPABASE_URL e chave anon",
          "Aplicar migrações em supabase/migrations/",
          "Configurar políticas RLS por inquilino"
        ]
      },
      smartlead: {
        title: "Envio Smartlead em produção",
        description: "Enviar campanhas de outreach via Smartlead em vez de simulação.",
        requirements: [
          "Definir SMARTLEAD_API_KEY e ID de campanha",
          "Definir OUTREACH_DELIVERY_PROVIDER=smartlead",
          "Validar domínios de remetente no Smartlead"
        ]
      },
      "hosted-storage": {
        title: "Armazenamento alojado",
        description: "Guardar logótipos, arte e mockups em armazenamento cloud.",
        requirements: [
          "Configurar Supabase Storage ou bucket S3",
          "Migrar ativos locais no onboarding do inquilino",
          "Usar URLs assinadas em emails para clientes"
        ]
      },
      "cup-customizer": {
        title: "Personalizador de Copos",
        description: "A configuração de copos in-app está ativa nesta build local.",
        requirements: ["Usa o pacote @cup-customizer com regras operacionais de preço"]
      },
      "local-db": {
        title: "Base de dados local",
        description: "Persistência IndexedDB para MVP offline-first.",
        requirements: ["Exporte backups regularmente em Definições → Backup"]
      }
    }
  }
};
