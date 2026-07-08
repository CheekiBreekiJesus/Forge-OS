import type { Locale } from "@/i18n/config";

export type InventoryProductCopy = {
  products: {
    eyebrow: string;
    title: string;
    description: string;
  };
  inventory: {
    eyebrow: string;
    title: string;
    description: string;
  };
  tabs: Record<
    | "overview"
    | "products"
    | "items"
    | "variants"
    | "references"
    | "packaging"
  | "stock"
  | "receipts"
  | "transfers"
  | "adjustments"
  | "reservations"
  | "barcodes"
    | "labels"
    | "imports",
    string
  >;
  cards: {
    physical: string;
    available: string;
    reserved: string;
    quarantine: string;
    receipt: string;
    transfer: string;
    unknownBarcode: string;
    labelPreview: string;
    zplDownload: string;
    imports: string;
  };
  actions: {
    postReceipt: string;
    postTransfer: string;
    reverseLast: string;
    resolveBarcode: string;
    downloadZpl: string;
    markReviewed: string;
  };
  labels: {
    reference: string;
    item: string;
    product: string;
    variant: string;
    warehouse: string;
    location: string;
    lot: string;
    quantity: string;
    status: string;
    barcode: string;
    condition: string;
    transaction: string;
    importState: string;
  };
  states: {
    active: string;
    staged: string;
    posted: string;
    needsReview: string;
    previewOnly: string;
  };
  messages: {
    noPrivateData: string;
    receiptPosted: string;
    transferPosted: string;
    barcodeResolved: string;
    barcodeUnknown: string;
    barcodeAmbiguous: string;
    importReviewed: string;
    previewAuthorization: string;
  };
  table: {
    products: string;
    items: string;
    movements: string;
    barcodes: string;
    imports: string;
  };
};

const en: InventoryProductCopy = {
  actions: {
    downloadZpl: "Download ZPL",
    markReviewed: "Mark reviewed",
    postReceipt: "Post demo receipt",
    postTransfer: "Post demo transfer",
    reverseLast: "Reverse last movement",
    resolveBarcode: "Resolve barcode"
  },
  cards: {
    available: "Available stock",
    imports: "Import staging",
    labelPreview: "Browser label preview",
    physical: "Physical stock",
    quarantine: "Quarantine",
    receipt: "Receipt workflow",
    reserved: "Reserved stock",
    transfer: "Transfer workflow",
    unknownBarcode: "Unknown barcode review",
    zplDownload: "ZPL download"
  },
  inventory: {
    description:
      "Ledger-backed inventory workspace with receipts, transfers, lots, barcodes, labels, stock counts and import staging.",
    eyebrow: "Inventory workspace",
    title: "Inventory control"
  },
  labels: {
    barcode: "Barcode",
    condition: "Condition",
    importState: "Import state",
    item: "Item",
    location: "Location",
    lot: "Lot",
    product: "Product",
    quantity: "Quantity",
    reference: "Reference",
    status: "Status",
    transaction: "Transaction",
    variant: "Variant",
    warehouse: "Warehouse"
  },
  messages: {
    barcodeAmbiguous: "Multiple active barcode records match. Keep in review.",
    barcodeResolved: "Barcode resolved to an active record.",
    barcodeUnknown: "Unknown barcode remains staged for review.",
    importReviewed: "Import row was marked for manual review.",
    noPrivateData: "Synthetic operational data only. No real JH Gomes supplier or customer records are included.",
    previewAuthorization: "Preview authorization only. Production auth and tenant enforcement remain future backend work.",
    receiptPosted: "Demo receipt posted to the in-session ledger preview (not persisted).",
    transferPosted: "Demo transfer posted as balanced in-session ledger entries (not persisted)."
  },
  products: {
    description:
      "Canonical product master, variants, customer-specific references, supplier references, packaging and sellable item links.",
    eyebrow: "Product workspace",
    title: "Product master"
  },
  states: {
    active: "Active",
    needsReview: "Needs review",
    posted: "Posted",
    previewOnly: "Preview only",
    staged: "Staged"
  },
  table: {
    barcodes: "Barcode registry",
    imports: "Staged import rows",
    items: "Inventory items",
    movements: "Movement history",
    products: "Products and variants"
  },
  tabs: {
    adjustments: "Adjustments",
    barcodes: "Barcodes",
    imports: "Imports",
    items: "Items",
    labels: "Labels",
    overview: "Overview",
    packaging: "Packaging",
    products: "Products",
    receipts: "Receipts",
    references: "References",
    reservations: "Reservations",
    stock: "Stock",
    transfers: "Transfers",
    variants: "Variants"
  }
};

const pt: InventoryProductCopy = {
  actions: {
    downloadZpl: "Descarregar ZPL",
    markReviewed: "Marcar em revisão",
    postReceipt: "Registar receção demo",
    postTransfer: "Registar transferência demo",
    reverseLast: "Reverter último movimento",
    resolveBarcode: "Resolver código"
  },
  cards: {
    available: "Stock disponível",
    imports: "Preparação de importação",
    labelPreview: "Pré-visualização da etiqueta",
    physical: "Stock físico",
    quarantine: "Quarentena",
    receipt: "Receção",
    reserved: "Stock reservado",
    transfer: "Transferência",
    unknownBarcode: "Revisão de código desconhecido",
    zplDownload: "ZPL"
  },
  inventory: {
    description:
      "Espaço de inventário com livro-razão, receções, transferências, lotes, códigos, etiquetas, contagens e importações preparadas.",
    eyebrow: "Inventário",
    title: "Controlo de inventário"
  },
  labels: {
    barcode: "Código",
    condition: "Condição",
    importState: "Estado da importação",
    item: "Artigo",
    location: "Localização",
    lot: "Lote",
    product: "Produto",
    quantity: "Quantidade",
    reference: "Referência",
    status: "Estado",
    transaction: "Movimento",
    variant: "Variante",
    warehouse: "Armazém"
  },
  messages: {
    barcodeAmbiguous: "Existem vários códigos ativos iguais. Mantém-se em revisão.",
    barcodeResolved: "Código resolvido para um registo ativo.",
    barcodeUnknown: "Código desconhecido fica preparado para revisão.",
    importReviewed: "Linha de importação marcada para revisão manual.",
    noPrivateData: "Apenas dados operacionais sintéticos. Não há dados reais de fornecedores ou clientes da JH Gomes.",
    previewAuthorization: "Autorização apenas em pré-visualização. A segurança de produção fica para o backend.",
    receiptPosted: "Receção demo registada na pré-visualização de sessão (não persistida).",
    transferPosted: "Transferência demo registada com movimentos equilibrados de sessão (não persistida)."
  },
  products: {
    description:
      "Base de produtos, variantes, referências de cliente e fornecedor, embalamento e ligação aos artigos em stock.",
    eyebrow: "Produtos",
    title: "Base de produtos"
  },
  states: {
    active: "Ativo",
    needsReview: "Requer revisão",
    posted: "Registado",
    previewOnly: "Pré-visualização",
    staged: "Preparado"
  },
  table: {
    barcodes: "Registo de códigos",
    imports: "Linhas de importação preparadas",
    items: "Artigos em stock",
    movements: "Histórico de movimentos",
    products: "Produtos e variantes"
  },
  tabs: {
    adjustments: "Ajustes",
    barcodes: "Códigos",
    imports: "Importações",
    items: "Artigos",
    labels: "Etiquetas",
    overview: "Resumo",
    packaging: "Embalamento",
    products: "Produtos",
    receipts: "Receções",
    references: "Referências",
    reservations: "Reservas",
    stock: "Stock",
    transfers: "Transferências",
    variants: "Variantes"
  }
};

export function getInventoryProductCopy(locale: Locale): InventoryProductCopy {
  return locale === "pt-PT" ? pt : en;
}
