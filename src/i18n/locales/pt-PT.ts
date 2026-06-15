import type { Dictionary } from "../dictionaries";

export const dictionary: Dictionary = {
  app: {
    name: "ForgeOS",
    tenantLabel: "Empresa de referencia",
    environment: "Base de prototipo"
  },
  navigation: {
    dashboard: "Painel",
    customers: "Clientes",
    products: "Produtos",
    orders: "Encomendas",
    production: "Producao",
    inventory: "Inventario",
    machines: "Maquinas",
    maintenance: "Manutencao",
    marketing: "Marketing",
    settings: "Definicoes"
  },
  dashboard: {
    searchPlaceholder: "Pesquisar...",
    searchShortcut: "Ctrl + K",
    dateRange: "13 - 19 Maio 2024",
    customize: "Personalizar",
    greeting: "Bom dia, operador.",
    userRole: "Diretor Geral",
    eyebrow: "Sistema operativo industrial",
    title: "Aqui esta o resumo da sua operacao.",
    description: "Base estatica de prototipo para o MVP do ForgeOS.",
    primaryAction: "Rever modulos MVP",
    secondaryAction: "Abrir definicoes",
    operationalSnapshot: "Resumo operacional",
    modulesTitle: "Modulos MVP em preparacao",
    nextStepsTitle: "Proximas tarefas recomendadas",
    languageLabel: "Idioma",
    status: {
      prototype: "Prototipo",
      foundation: "Base",
      planned: "Planeado",
      online: "Online",
      operational: "Operacional",
      production: "Producao"
    },
    metrics: [
      {
        label: "Producao OEE",
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
        label: "Orcamentos abertos",
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
        label: "Alertas manutencao",
        value: "5",
        detail: "vs semana passada",
        trend: "- 1",
        tone: "amber"
      }
    ],
    production: {
      title: "Producao - OEE",
      score: "78.5%",
      availability: "Disponibilidade",
      performance: "Performance",
      quality: "Qualidade",
      days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]
    },
    inventory: {
      title: "Inventario - Resumo",
      viewAll: "Ver tudo",
      items: [
        {
          name: "ABS natural",
          category: "Materia-prima",
          quantity: "2,450 kg",
          minimum: "Min: 1,000 kg",
          tone: "green"
        },
        {
          name: "Polipropileno",
          category: "Materia-prima",
          quantity: "1,200 kg",
          minimum: "Min: 1,000 kg",
          tone: "amber"
        },
        {
          name: "Aco P20",
          category: "Materia-prima",
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
          title: "Manutencao preventiva no injetor 02",
          detail: "Vence em 2 dias",
          time: "09:15",
          priority: "Alta",
          tone: "red"
        },
        {
          title: "Molde JG-102 precisa de manutencao",
          detail: "Proxima semana",
          time: "08:47",
          priority: "Media",
          tone: "amber"
        },
        {
          title: "Ordem de producao OP-045 atrasada",
          detail: "Atraso de 1 dia",
          time: "08:30",
          priority: "Alta",
          tone: "red"
        },
        {
          title: "Stock baixo: Aco P20",
          detail: "Abaixo do minimo",
          time: "07:58",
          priority: "Alta",
          tone: "red"
        },
        {
          title: "Orcamento Q-0487 aguarda resposta",
          detail: "Cliente: conta demo",
          time: "Ontem",
          priority: "Baixa",
          tone: "green"
        }
      ]
    },
    orders: {
      title: "Encomendas de producao",
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
          product: "Caixa tecnica A",
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
      prompt: "Quais moldes precisam de manutencao no proximo mes?",
      answer:
        "Este prototipo mantem a IA desativada. O futuro assistente deve resumir registos operacionais com isolamento por empresa depois das regras de privacidade estarem definidas.",
      input: "Pergunte algo..."
    },
    modules: [
      {
        key: "dashboard",
        title: "Painel",
        description: "Visao geral para equipas operacionais.",
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
        description: "Futuros produtos, variantes e parametros de producao.",
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
        title: "Producao",
        description: "Futuras ordens de producao e fichas tecnicas.",
        status: "Planeado"
      },
      {
        key: "inventory",
        title: "Inventario",
        description: "Futuros registos de stock para materiais e consumiveis.",
        status: "Planeado"
      },
      {
        key: "machines",
        title: "Maquinas",
        description: "Futuros registos de equipamento e documentacao de setup.",
        status: "Planeado"
      },
      {
        key: "maintenance",
        title: "Manutencao",
        description: "Futuras tarefas de manutencao preventiva e corretiva.",
        status: "Planeado"
      },
      {
        key: "marketing",
        title: "Marketing",
        description: "Futuro apoio a conteudos e campanhas.",
        status: "Planeado"
      },
      {
        key: "settings",
        title: "Definicoes",
        description: "Futura configuracao da empresa e controlos de idioma.",
        status: "Planeado"
      }
    ],
    nextSteps: [
      "Escolher base de dados, ORM e fornecedor de autenticacao.",
      "Definir membros da empresa, funcoes e limites de acesso.",
      "Criar os primeiros esquemas de clientes, produtos, encomendas e producao.",
      "Manter todo o texto operacional nos dicionarios de localizacao."
    ],
    footer: {
      version: "ForgeOS v0.1.0",
      copyright: "Base de prototipo. Nao inclui dados operacionais privados.",
      system: "Sistema",
      database: "Base de dados",
      backup: "Backup",
      environment: "Ambiente",
      support: "Suporte"
    }
  },
  modulePage: {
    backToDashboard: "Voltar ao painel",
    prototypeNotice: "Pagina estatica de planeamento MVP. Dados, permissoes e isolamento por empresa ainda nao estao implementados.",
    primaryAction: "Definir esquema",
    secondaryAction: "Rever fluxo",
    readinessTitle: "Preparacao",
    roadmapTitle: "Proximos passos de construcao",
    emptyStateTitle: "Ainda nao existem registos",
    emptyStateDescription: "Este modulo esta pronto para desenho de UI e modelo de dados, mas ainda nao guarda dados de negocio.",
    tableHeaders: {
      area: "Area",
      priority: "Prioridade",
      status: "Estado",
      owner: "Responsavel"
    },
    modules: {
      customers: {
        eyebrow: "Base CRM",
        title: "Clientes",
        description: "Preparar a area de clientes para registos por empresa, contactos, notas e historico de encomendas.",
        stats: [
          { label: "Modelo de dados", value: "Rascunho", detail: "Os campos de cliente existem nos documentos de passagem." },
          { label: "Privacidade", value: "Alta", detail: "Dados de contacto nao devem aparecer em seed data." },
          { label: "Fluxo MVP", value: "Proximo", detail: "Lista, detalhe e criacao rapida." }
        ],
        roadmap: ["Confirmar campos obrigatorios de cliente.", "Desenhar lista e detalhe com isolamento por empresa.", "Adicionar validacao antes de persistencia."],
        tableRows: [
          { area: "Lista de clientes", priority: "Alta", status: "Planeado", owner: "CRM" },
          { area: "Detalhe de cliente", priority: "Alta", status: "Planeado", owner: "CRM" },
          { area: "Notas de contacto", priority: "Media", status: "Planeado", owner: "CRM" }
        ]
      },
      products: {
        eyebrow: "Base de catalogo",
        title: "Produtos",
        description: "Preparar produtos e variantes para artigos fabricados, consumiveis e parametros de producao por empresa.",
        stats: [
          { label: "Variantes", value: "Necessario", detail: "Tamanhos de copo e opcoes de produto precisam de variantes." },
          { label: "Parametros", value: "Config", detail: "Velocidade e setup devem ser configuraveis por empresa." },
          { label: "Fluxo MVP", value: "Proximo", detail: "Lista, detalhe e configuracao de variantes." }
        ],
        roadmap: ["Definir formularios de produto e variantes.", "Separar parametros reutilizaveis dos defaults da empresa.", "Ligar produtos a encomendas e producao mais tarde."],
        tableRows: [
          { area: "Lista de produtos", priority: "Alta", status: "Planeado", owner: "Produtos" },
          { area: "Variantes", priority: "Alta", status: "Planeado", owner: "Produtos" },
          { area: "Defaults de producao", priority: "Media", status: "Planeado", owner: "Producao" }
        ]
      },
      orders: {
        eyebrow: "Operacoes de encomendas",
        title: "Encomendas",
        description: "Preparar seguimento de encomendas com linhas, datas pedidas de entrega e futura criacao de ordens de producao.",
        stats: [
          { label: "Linhas", value: "Obrigatorio", detail: "Uma encomenda pode incluir varios produtos." },
          { label: "Estados", value: "Rascunho", detail: "O fluxo de estados ainda precisa de confirmacao." },
          { label: "Fluxo MVP", value: "Proximo", detail: "Lista, detalhe e captura de linhas." }
        ],
        roadmap: ["Confirmar nomes dos estados de encomenda.", "Desenhar entrada rapida para encomendas por telefone.", "Ligar linhas a ordens de producao mais tarde."],
        tableRows: [
          { area: "Lista de encomendas", priority: "Alta", status: "Planeado", owner: "Encomendas" },
          { area: "Detalhe da encomenda", priority: "Alta", status: "Planeado", owner: "Encomendas" },
          { area: "Linhas", priority: "Alta", status: "Planeado", owner: "Encomendas" }
        ]
      },
      production: {
        eyebrow: "Fluxo de fabrica",
        title: "Producao",
        description: "Preparar ordens de producao, fichas tecnicas, notas de setup, controlos de qualidade, rejeicoes e notas de operador.",
        stats: [
          { label: "Fichas tecnicas", value: "Core", detail: "Devem existir modelos reutilizaveis e copias por trabalho." },
          { label: "Rejeicoes", value: "MVP", detail: "Quantidades planeadas, produzidas e rejeitadas sao importantes." },
          { label: "Impressao", value: "Depois", detail: "As fichas de producao devem poder ser impressas." }
        ],
        roadmap: ["Definir ciclo de vida da ordem de producao.", "Desenhar estrutura da ficha tecnica.", "Adicionar impressao/exportacao depois dos dados core."],
        tableRows: [
          { area: "Lista de trabalhos", priority: "Alta", status: "Planeado", owner: "Producao" },
          { area: "Fichas tecnicas", priority: "Alta", status: "Planeado", owner: "Producao" },
          { area: "Controlos de qualidade", priority: "Media", status: "Planeado", owner: "Producao" }
        ]
      },
      inventory: {
        eyebrow: "Base de armazem",
        title: "Inventario",
        description: "Preparar registos basicos de stock para materiais, produtos acabados, consumiveis, pecas e niveis de reposicao.",
        stats: [
          { label: "Stock", value: "MVP", detail: "Quantidade em mao antes de movimentos." },
          { label: "Localizacoes", value: "Depois", detail: "O modelo de localizacao ainda precisa de confirmacao." },
          { label: "Reposicao", value: "Necessario", detail: "Limites devem ser configuraveis por empresa." }
        ],
        roadmap: ["Definir categorias de item de inventario.", "Criar estados basicos da lista de stock.", "Adiar movimentos de stock ate validar o basico."],
        tableRows: [
          { area: "Lista de stock", priority: "Alta", status: "Planeado", owner: "Inventario" },
          { area: "Limites de reposicao", priority: "Media", status: "Planeado", owner: "Inventario" },
          { area: "Fornecedores", priority: "Media", status: "Adiado", owner: "Compras" }
        ]
      },
      machines: {
        eyebrow: "Registos de equipamento",
        title: "Maquinas",
        description: "Preparar registos de maquinas, documentacao de setup, estado e ligacoes a producao e manutencao.",
        stats: [
          { label: "Registo", value: "MVP", detail: "Nome, tipo, modelo, estado e notas." },
          { label: "Setup", value: "Necessario", detail: "Util antes de telemetria complexa." },
          { label: "Telemetria", value: "Adiado", detail: "Nao faz parte do primeiro MVP." }
        ],
        roadmap: ["Definir campos de maquina.", "Desenhar ecras de documentacao de setup.", "Ligar maquinas a trabalhos e manutencao mais tarde."],
        tableRows: [
          { area: "Lista de maquinas", priority: "Alta", status: "Planeado", owner: "Maquinas" },
          { area: "Notas de setup", priority: "Alta", status: "Planeado", owner: "Producao" },
          { area: "Telemetria", priority: "Baixa", status: "Adiado", owner: "Maquinas" }
        ]
      },
      maintenance: {
        eyebrow: "Base CMMS",
        title: "Manutencao",
        description: "Preparar manutencao preventiva e corretiva para maquinas, notas de paragem e uso de pecas.",
        stats: [
          { label: "Tarefas", value: "Planeado", detail: "Tipos preventivo e corretivo." },
          { label: "Paragens", value: "Depois", detail: "Registar depois de existirem maquinas." },
          { label: "Pecas", value: "Depois", detail: "Ligar ao inventario depois do stock basico." }
        ],
        roadmap: ["Definir estados de tarefa de manutencao.", "Criar lista e detalhe ligados a maquinas.", "Ligar pecas apos existir inventario."],
        tableRows: [
          { area: "Lista de tarefas", priority: "Media", status: "Planeado", owner: "Manutencao" },
          { area: "Ligacao a maquina", priority: "Media", status: "Planeado", owner: "Maquinas" },
          { area: "Pecas", priority: "Baixa", status: "Adiado", owner: "Inventario" }
        ]
      },
      marketing: {
        eyebrow: "Ferramentas de conteudo",
        title: "Marketing",
        description: "Preparar uma area simples para ideias de conteudo, assets, notas de campanha e futura escrita assistida por IA.",
        stats: [
          { label: "Assets", value: "Depois", detail: "MarketingAsset existe no rascunho do modelo de dados." },
          { label: "Brevo", value: "Adiado", detail: "Sem integracao direta na base." },
          { label: "IA", value: "Adiado", detail: "Fornecedor e regras de privacidade por definir." }
        ],
        roadmap: ["Definir campos de asset de marketing.", "Manter conteudo localizado por idioma.", "Adiar integracoes externas."],
        tableRows: [
          { area: "Lista de assets", priority: "Baixa", status: "Planeado", owner: "Marketing" },
          { area: "Notas de campanha", priority: "Baixa", status: "Planeado", owner: "Marketing" },
          { area: "Integracao email", priority: "Baixa", status: "Adiado", owner: "Marketing" }
        ]
      },
      settings: {
        eyebrow: "Configuracao da empresa",
        title: "Definicoes",
        description: "Preparar definicoes de empresa para idioma por defeito, configuracao, utilizadores, funcoes e futuras permissoes.",
        stats: [
          { label: "Idioma base", value: "pt-PT", detail: "A instalacao de referencia usa portugues europeu." },
          { label: "Utilizadores", value: "Adiado", detail: "E necessario escolher fornecedor de autenticacao." },
          { label: "Funcoes", value: "Rascunho", detail: "Existem nomes de funcoes, mas permissoes estao em aberto." }
        ],
        roadmap: ["Escolher fornecedor de autenticacao.", "Definir regras de membros por empresa.", "Adicionar convencoes seguras de variaveis de ambiente."],
        tableRows: [
          { area: "Perfil da empresa", priority: "Alta", status: "Planeado", owner: "Admin" },
          { area: "Utilizadores e funcoes", priority: "Alta", status: "Bloqueado", owner: "Auth" },
          { area: "Localizacao", priority: "Alta", status: "Base", owner: "Plataforma" }
        ]
      }
    }
  }
};
