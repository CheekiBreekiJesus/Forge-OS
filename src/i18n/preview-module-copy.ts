import type { PreviewModuleKey } from "@/modules/config";

type PreviewModuleCopy = {
  eyebrow: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string; detail: string }>;
  roadmap: string[];
  tableRows: Array<{ area: string; priority: string; status: string; owner: string }>;
  primaryActionHref?: string;
  secondaryActionHref?: string;
};

const enPreview: Record<PreviewModuleKey, PreviewModuleCopy> = {
  crm: {
    eyebrow: "Commercial relationships",
    title: "CRM",
    description: "Preview workspace for pipeline visibility, customer context, and outreach handoffs.",
    stats: [
      { label: "Active leads", value: "Preview", detail: "Connects to Outreach and Customers." },
      { label: "Open opportunities", value: "Preview", detail: "Uses local CRM records when available." },
      { label: "Outreach ready", value: "Live", detail: "Approved emails remain in Outreach." }
    ],
    roadmap: ["Unify lead and customer timelines.", "Add pipeline stages.", "Connect tasks to Outreach."],
    tableRows: [
      { area: "Lead workspace", priority: "High", status: "Live via Outreach", owner: "Sales" },
      { area: "Customer context", priority: "High", status: "Live", owner: "CRM" },
      { area: "Pipeline board", priority: "Medium", status: "Preview", owner: "CRM" }
    ],
    primaryActionHref: "leadops",
    secondaryActionHref: "customers"
  },
  salesOrders: {
    eyebrow: "Order fulfillment",
    title: "Sales orders",
    description: "Preview shell for customer orders after quotation approval.",
    stats: [
      { label: "Open orders", value: "Preview", detail: "Production orders cover current MVP flow." },
      { label: "Delayed", value: "Preview", detail: "Dashboard highlights blocked jobs." },
      { label: "Linked quotes", value: "Live", detail: "Quotations module is available today." }
    ],
    roadmap: ["Define sales order schema.", "Link approved quotes.", "Hand off to production."],
    tableRows: [
      { area: "Order list", priority: "High", status: "Preview", owner: "Sales" },
      { area: "Delivery dates", priority: "High", status: "Preview", owner: "Operations" },
      { area: "Production handoff", priority: "Medium", status: "Partial", owner: "Production" }
    ],
    primaryActionHref: "quotations",
    secondaryActionHref: "production"
  },
  molds: {
    eyebrow: "Tooling lifecycle",
    title: "Molds",
    description: "Preview workspace for mold registry, shot counts, and maintenance planning.",
    stats: [
      { label: "Molds tracked", value: "Preview", detail: "Demo maintenance insights on dashboard." },
      { label: "Maintenance due", value: "Preview", detail: "Alerts link to Maintenance." },
      { label: "Open repairs", value: "Preview", detail: "No live mold registry yet." }
    ],
    roadmap: ["Create mold registry.", "Track lifetime shots.", "Schedule preventive maintenance."],
    tableRows: [
      { area: "Mold registry", priority: "High", status: "Preview", owner: "Production" },
      { area: "Maintenance plan", priority: "High", status: "Preview", owner: "Maintenance" },
      { area: "Repairs", priority: "Medium", status: "Preview", owner: "Maintenance" }
    ],
    primaryActionHref: "maintenance",
    secondaryActionHref: "production"
  },
  quality: {
    eyebrow: "Quality control",
    title: "Quality",
    description: "Preview shell for inspections, non-conformities, and rejected quantity tracking.",
    stats: [
      { label: "Open inspections", value: "Preview", detail: "Production jobs track rejects locally." },
      { label: "Non-conformities", value: "Preview", detail: "Future quality records." },
      { label: "Rejected quantity", value: "Partial", detail: "Available on production orders." }
    ],
    roadmap: ["Define inspection templates.", "Capture non-conformities.", "Report rejected lots."],
    tableRows: [
      { area: "Inspections", priority: "High", status: "Preview", owner: "Quality" },
      { area: "Non-conformities", priority: "High", status: "Preview", owner: "Quality" },
      { area: "Reports", priority: "Medium", status: "Preview", owner: "Quality" }
    ],
    primaryActionHref: "production",
    secondaryActionHref: "reports"
  },
  purchasing: {
    eyebrow: "Procurement",
    title: "Purchasing",
    description: "Preview workspace for purchase orders, approvals, and reorder suggestions.",
    stats: [
      { label: "Open POs", value: "Preview", detail: "Inventory reorder alerts are live." },
      { label: "Pending approvals", value: "Preview", detail: "No PO workflow yet." },
      { label: "Below reorder", value: "Live", detail: "Inventory warnings feed dashboard alerts." }
    ],
    roadmap: ["Define purchase order schema.", "Add supplier lead times.", "Connect inventory thresholds."],
    tableRows: [
      { area: "Purchase orders", priority: "High", status: "Preview", owner: "Purchasing" },
      { area: "Approvals", priority: "Medium", status: "Preview", owner: "Finance" },
      { area: "Reorder rules", priority: "High", status: "Partial", owner: "Inventory" }
    ],
    primaryActionHref: "inventory",
    secondaryActionHref: "suppliers"
  },
  suppliers: {
    eyebrow: "Supplier network",
    title: "Suppliers",
    description: "Preview shell for supplier records, lead times, and purchasing links.",
    stats: [
      { label: "Suppliers", value: "Preview", detail: "Supplier master data not stored yet." },
      { label: "Lead times", value: "Preview", detail: "Future purchasing integration." },
      { label: "Linked materials", value: "Preview", detail: "Inventory categories are available." }
    ],
    roadmap: ["Create supplier registry.", "Track lead times.", "Link to purchase orders."],
    tableRows: [
      { area: "Supplier list", priority: "High", status: "Preview", owner: "Purchasing" },
      { area: "Lead times", priority: "Medium", status: "Preview", owner: "Purchasing" },
      { area: "Material links", priority: "Medium", status: "Preview", owner: "Inventory" }
    ],
    primaryActionHref: "purchasing",
    secondaryActionHref: "inventory"
  },
  sales: {
    eyebrow: "Commercial performance",
    title: "Sales",
    description: "Preview shell for revenue follow-up, quote conversion, and outreach activity.",
    stats: [
      { label: "Open quotes", value: "Live", detail: "Managed in Quotations." },
      { label: "Outreach ready", value: "Live", detail: "Managed in Outreach." },
      { label: "Pipeline", value: "Preview", detail: "CRM preview connects here." }
    ],
    roadmap: ["Add sales pipeline KPIs.", "Connect quotes and outreach.", "Forecast revenue."],
    tableRows: [
      { area: "Pipeline", priority: "High", status: "Preview", owner: "Sales" },
      { area: "Quote follow-up", priority: "High", status: "Live", owner: "Sales" },
      { area: "Outreach", priority: "High", status: "Live", owner: "Marketing" }
    ],
    primaryActionHref: "leadops",
    secondaryActionHref: "quotations"
  },
  billing: {
    eyebrow: "Invoicing",
    title: "Billing",
    description: "Preview shell for invoices, payment status, and exported financial summaries.",
    stats: [
      { label: "Open invoices", value: "Preview", detail: "No billing records yet." },
      { label: "Estimated revenue", value: "Preview", detail: "Dashboard uses quote totals when available." },
      { label: "Exports", value: "Preview", detail: "Reports module will host exports." }
    ],
    roadmap: ["Define invoice schema.", "Connect approved quotes.", "Add export actions."],
    tableRows: [
      { area: "Invoices", priority: "High", status: "Preview", owner: "Finance" },
      { area: "Payments", priority: "Medium", status: "Preview", owner: "Finance" },
      { area: "Exports", priority: "Medium", status: "Preview", owner: "Reports" }
    ],
    primaryActionHref: "reports",
    secondaryActionHref: "quotations"
  },
  reports: {
    eyebrow: "Operational intelligence",
    title: "Reports",
    description: "Preview shell for operational, financial, and marketing summaries with export actions.",
    stats: [
      { label: "Operational", value: "Preview", detail: "Dashboard panels provide live local summaries." },
      { label: "Financial", value: "Preview", detail: "Uses quote totals when available." },
      { label: "Marketing", value: "Partial", detail: "Outreach metrics are live." }
    ],
    roadmap: ["Add export presets.", "Combine dashboard metrics.", "Schedule report snapshots."],
    tableRows: [
      { area: "Operational reports", priority: "High", status: "Preview", owner: "Operations" },
      { area: "Financial summaries", priority: "Medium", status: "Preview", owner: "Finance" },
      { area: "Marketing reports", priority: "Medium", status: "Partial", owner: "Marketing" }
    ],
    primaryActionHref: "leadops",
    secondaryActionHref: "production"
  }
};

const ptPreview: Record<PreviewModuleKey, PreviewModuleCopy> = {
  crm: {
    ...enPreview.crm,
    eyebrow: "Relações comerciais",
    title: "CRM",
    description: "Área de pré-visualização para pipeline, contexto de clientes e ligações ao Outreach.",
    stats: [
      { label: "Leads ativos", value: "Pré-visualização", detail: "Liga ao Outreach e Clientes." },
      { label: "Oportunidades abertas", value: "Pré-visualização", detail: "Usa registos CRM locais quando existirem." },
      { label: "Outreach pronto", value: "Ativo", detail: "Emails aprovados continuam no Outreach." }
    ],
    roadmap: ["Unificar linha temporal de leads e clientes.", "Adicionar fases do pipeline.", "Ligar tarefas ao Outreach."],
    tableRows: [
      { area: "Workspace de leads", priority: "Alta", status: "Ativo via Outreach", owner: "Comercial" },
      { area: "Contexto de clientes", priority: "Alta", status: "Ativo", owner: "CRM" },
      { area: "Pipeline", priority: "Média", status: "Pré-visualização", owner: "CRM" }
    ]
  },
  salesOrders: {
    ...enPreview.salesOrders,
    eyebrow: "Cumprimento de encomendas",
    title: "Encomendas",
    description: "Área de pré-visualização para encomendas após aprovação de orçamentos.",
    stats: [
      { label: "Encomendas abertas", value: "Pré-visualização", detail: "Ordens de produção cobrem o fluxo MVP." },
      { label: "Em atraso", value: "Pré-visualização", detail: "O painel destaca trabalhos bloqueados." },
      { label: "Orçamentos ligados", value: "Ativo", detail: "O módulo Orçamentos está disponível." }
    ]
  },
  molds: {
    ...enPreview.molds,
    eyebrow: "Ciclo de moldes",
    title: "Moldes",
    description: "Área de pré-visualização para registo de moldes, ciclos e manutenção.",
    stats: [
      { label: "Moldes registados", value: "Pré-visualização", detail: "Insights demo no painel." },
      { label: "Manutenção devida", value: "Pré-visualização", detail: "Alertas ligam à Manutenção." },
      { label: "Reparações abertas", value: "Pré-visualização", detail: "Sem registo live de moldes." }
    ]
  },
  quality: {
    ...enPreview.quality,
    eyebrow: "Controlo de qualidade",
    title: "Qualidade",
    description: "Área de pré-visualização para inspeções, não conformidades e rejeições.",
    stats: [
      { label: "Inspeções abertas", value: "Pré-visualização", detail: "Ordens de produção registem rejeições." },
      { label: "Não conformidades", value: "Pré-visualização", detail: "Registos futuros de qualidade." },
      { label: "Quantidade rejeitada", value: "Parcial", detail: "Disponível nas ordens de produção." }
    ]
  },
  purchasing: {
    ...enPreview.purchasing,
    eyebrow: "Aprovisionamento",
    title: "Compras",
    description: "Área de pré-visualização para ordens de compra, aprovações e reposição.",
    stats: [
      { label: "OC abertas", value: "Pré-visualização", detail: "Alertas de inventário estão ativos." },
      { label: "Aprovações pendentes", value: "Pré-visualização", detail: "Sem fluxo de OC ainda." },
      { label: "Abaixo do mínimo", value: "Ativo", detail: "Avisos de inventário alimentam alertas." }
    ]
  },
  suppliers: {
    ...enPreview.suppliers,
    eyebrow: "Rede de fornecedores",
    title: "Fornecedores",
    description: "Área de pré-visualização para fornecedores, prazos e ligações a compras.",
    stats: [
      { label: "Fornecedores", value: "Pré-visualização", detail: "Sem dados master ainda." },
      { label: "Prazos", value: "Pré-visualização", detail: "Integração futura com compras." },
      { label: "Materiais ligados", value: "Pré-visualização", detail: "Categorias de inventário disponíveis." }
    ]
  },
  sales: {
    ...enPreview.sales,
    eyebrow: "Performance comercial",
    title: "Vendas",
    description: "Área de pré-visualização para follow-up, conversão de orçamentos e outreach.",
    stats: [
      { label: "Orçamentos abertos", value: "Ativo", detail: "Geridos em Orçamentos." },
      { label: "Outreach pronto", value: "Ativo", detail: "Gerido no Outreach." },
      { label: "Pipeline", value: "Pré-visualização", detail: "CRM liga-se aqui." }
    ]
  },
  billing: {
    ...enPreview.billing,
    eyebrow: "Faturação",
    title: "Faturação",
    description: "Área de pré-visualização para faturas, pagamentos e resumos financeiros.",
    stats: [
      { label: "Faturas abertas", value: "Pré-visualização", detail: "Sem registos de faturação." },
      { label: "Receita estimada", value: "Pré-visualização", detail: "Painel usa totais de orçamentos quando existirem." },
      { label: "Exportações", value: "Pré-visualização", detail: "Relatórios alojará exportações." }
    ]
  },
  reports: {
    ...enPreview.reports,
    eyebrow: "Inteligência operacional",
    title: "Relatórios",
    description: "Área de pré-visualização para resumos operacionais, financeiros e de marketing.",
    stats: [
      { label: "Operacionais", value: "Pré-visualização", detail: "Painéis locais fornecem resumos live." },
      { label: "Financeiros", value: "Pré-visualização", detail: "Usa totais de orçamentos quando existirem." },
      { label: "Marketing", value: "Parcial", detail: "Métricas de outreach estão ativas." }
    ]
  }
};

export function getPreviewModuleCopy(locale: "en" | "pt-PT") {
  return locale === "pt-PT" ? ptPreview : enPreview;
}
