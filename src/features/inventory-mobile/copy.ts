import type { Locale } from "@/i18n/config";

export type InventoryMobileCopy = {
  scanner: {
    title: string;
    description: string;
    backToInventory: string;
    scanArea: string;
    scanStatus: {
      idle: string;
      scanning: string;
      detected: string;
      resolving: string;
      permissionDenied: string;
      insecureContext: string;
      noCamera: string;
      unsupported: string;
      stopped: string;
    };
    manualEntry: {
      label: string;
      placeholder: string;
      submit: string;
      hint: string;
    };
    controls: {
      startCamera: string;
      stopCamera: string;
      torchOn: string;
      torchOff: string;
      selectCamera: string;
      rescan: string;
    };
  };
  item: {
    barcode: string;
    reference: string;
    itemType: string;
    currentStock: string;
    unit: string;
    location: string;
    reorderLevel: string;
    lowStock: string;
    stockOk: string;
    recentMovements: string;
    noMovements: string;
    recentScans: string;
    movementTypes: {
      receipt: string;
      issue: string;
      transfer: string;
      lookup: string;
    };
  };
  transaction: {
    typeReceipt: string;
    typeIssue: string;
    typeTransfer: string;
    typeLookup: string;
    quantity: string;
    reason: string;
    notes: string;
    sourceLocation: string;
    destinationLocation: string;
    confirm: string;
    cancel: string;
    submitting: string;
    success: string;
    queued: string;
    failure: string;
    permissionDenied: string;
    negativeStockBlocked: string;
    quantityRequired: string;
    locationRequired: string;
    destinationRequired: string;
    transferSameLocation: string;
    confirmTitle: string;
    confirmReceipt: string;
    confirmIssue: string;
    confirmTransfer: string;
    lookupHint: string;
  };
  unknown: {
    title: string;
    scannedCode: string;
    message: string;
    registrationNote: string;
    searchPlaceholder: string;
    useSelected: string;
    noSearchResults: string;
    linkBarcode: string;
    linkSuccess: string;
    linkFailure: string;
    linkPermissionDenied: string;
    sessionOnly: string;
  };
  ambiguous: {
    title: string;
    scannedCode: string;
    message: string;
    matchCount: string;
    rescan: string;
  };
  offline: {
    pendingTitle: string;
    pendingCount: string;
    syncing: string;
    syncNow: string;
    failedTitle: string;
    retry: string;
    offlineNotice: string;
  };
  desktop: {
    openScanner: string;
    recentMovements: string;
    movementReason: string;
    movementWhen: string;
  };
};

const en: InventoryMobileCopy = {
  scanner: {
    title: "Scan barcode",
    description: "Scan a product barcode or enter the code manually.",
    backToInventory: "Back to inventory",
    scanArea: "Align the barcode inside the frame",
    scanStatus: {
      idle: "Ready to scan",
      scanning: "Scanning…",
      detected: "Code detected",
      resolving: "Looking up item…",
      permissionDenied:
        "Camera access was denied. Use manual entry below or allow camera access in browser settings.",
      insecureContext:
        "Camera access requires a secure context (HTTPS). Use manual entry below or open ForgeOS over HTTPS on this device.",
      noCamera: "No camera found on this device. Use manual entry below.",
      unsupported: "Live camera scanning is not supported in this browser. Use manual entry below.",
      stopped: "Camera stopped"
    },
    manualEntry: {
      label: "Enter barcode manually",
      placeholder: "Type or scan with a USB scanner",
      submit: "Look up code",
      hint: "Works with keyboard-wedge barcode scanners and manual typing."
    },
    controls: {
      startCamera: "Start camera",
      stopCamera: "Stop camera",
      torchOn: "Torch on",
      torchOff: "Torch off",
      selectCamera: "Camera",
      rescan: "Scan another code"
    }
  },
  item: {
    barcode: "Barcode",
    reference: "Reference",
    itemType: "Item type",
    currentStock: "Available stock",
    unit: "Unit",
    location: "Location",
    reorderLevel: "Minimum stock",
    lowStock: "Low stock",
    stockOk: "Stock OK",
    recentMovements: "Recent movements",
    noMovements: "No movements recorded yet.",
    recentScans: "Recent scans",
    movementTypes: {
      receipt: "Receive",
      issue: "Issue",
      transfer: "Transfer",
      lookup: "Stock lookup"
    }
  },
  transaction: {
    typeReceipt: "Receive",
    typeIssue: "Issue",
    typeTransfer: "Transfer",
    typeLookup: "Lookup",
    quantity: "Quantity",
    reason: "Reason code",
    notes: "Notes (optional)",
    sourceLocation: "Source location",
    destinationLocation: "Destination location",
    confirm: "Confirm and post",
    cancel: "Cancel",
    submitting: "Posting…",
    success: "Movement posted successfully.",
    queued: "Movement queued and will sync when you are back online.",
    failure: "Could not post movement.",
    permissionDenied: "You do not have permission for this inventory action.",
    negativeStockBlocked: "Not enough available stock at the selected location.",
    quantityRequired: "Enter a quantity greater than zero.",
    locationRequired: "Select a location.",
    destinationRequired: "Select a destination location.",
    transferSameLocation: "Source and destination must differ.",
    confirmTitle: "Confirm movement",
    confirmReceipt: "Receive",
    confirmIssue: "Issue",
    confirmTransfer: "Transfer",
    lookupHint: "Review stock levels without posting a movement."
  },
  unknown: {
    title: "Unknown barcode",
    scannedCode: "Scanned code",
    message: "This code is not registered for any active inventory item in this tenant.",
    registrationNote: "Items are never created automatically from unknown scans.",
    searchPlaceholder: "Search inventory by name or reference",
    useSelected: "Use for this session only",
    noSearchResults: "No matching items.",
    linkBarcode: "Link barcode to selected item",
    linkSuccess: "Barcode linked to item.",
    linkFailure: "Could not link barcode.",
    linkPermissionDenied: "Only authorised users can link barcodes permanently.",
    sessionOnly: "Session-only selection — barcode is not saved."
  },
  ambiguous: {
    title: "Ambiguous barcode",
    scannedCode: "Scanned code",
    message: "Multiple active barcode records match this code. Resolve duplicates in inventory before scanning again.",
    matchCount: "matching records",
    rescan: "Scan another code"
  },
  offline: {
    pendingTitle: "Pending sync",
    pendingCount: "movements waiting to sync",
    syncing: "Syncing queued movements…",
    syncNow: "Sync now",
    failedTitle: "Sync failures",
    retry: "Retry sync",
    offlineNotice: "You are offline. Confirmed movements will queue until connectivity returns."
  },
  desktop: {
    openScanner: "Mobile scanner",
    recentMovements: "Recent stock movements",
    movementReason: "Reason",
    movementWhen: "When"
  }
};

const ptPT: InventoryMobileCopy = {
  scanner: {
    title: "Ler código de barras",
    description: "Leia o código de barras do produto ou introduza o código manualmente.",
    backToInventory: "Voltar ao inventário",
    scanArea: "Alinhe o código de barras dentro da moldura",
    scanStatus: {
      idle: "Pronto para ler",
      scanning: "A ler…",
      detected: "Código detetado",
      resolving: "A procurar artigo…",
      permissionDenied:
        "O acesso à câmara foi recusado. Utilize a entrada manual abaixo ou permita a câmara nas definições do navegador.",
      insecureContext:
        "O acesso à câmara requer um contexto seguro (HTTPS). Utilize a entrada manual abaixo ou abra o ForgeOS por HTTPS neste dispositivo.",
      noCamera: "Nenhuma câmara encontrada neste dispositivo. Utilize a entrada manual abaixo.",
      unsupported:
        "A leitura por câmara não é suportada neste navegador. Utilize a entrada manual abaixo.",
      stopped: "Câmara parada"
    },
    manualEntry: {
      label: "Introduzir código manualmente",
      placeholder: "Escreva ou leia com leitor USB",
      submit: "Procurar código",
      hint: "Funciona com leitores USB tipo teclado e escrita manual."
    },
    controls: {
      startCamera: "Iniciar câmara",
      stopCamera: "Parar câmara",
      torchOn: "Lanterna ligada",
      torchOff: "Lanterna desligada",
      selectCamera: "Câmara",
      rescan: "Ler outro código"
    }
  },
  item: {
    barcode: "Código de barras",
    reference: "Referência",
    itemType: "Tipo de artigo",
    currentStock: "Stock disponível",
    unit: "Unidade",
    location: "Localização",
    reorderLevel: "Stock mínimo",
    lowStock: "Stock baixo",
    stockOk: "Stock OK",
    recentMovements: "Movimentos recentes",
    noMovements: "Ainda sem movimentos registados.",
    recentScans: "Leituras recentes",
    movementTypes: {
      receipt: "Entrada",
      issue: "Saída",
      transfer: "Transferência",
      lookup: "Consulta"
    }
  },
  transaction: {
    typeReceipt: "Entrada",
    typeIssue: "Saída",
    typeTransfer: "Transferência",
    typeLookup: "Consulta",
    quantity: "Quantidade",
    reason: "Código de motivo",
    notes: "Notas (opcional)",
    sourceLocation: "Localização de origem",
    destinationLocation: "Localização de destino",
    confirm: "Confirmar e registar",
    cancel: "Cancelar",
    submitting: "A registar…",
    success: "Movimento registado com sucesso.",
    queued: "Movimento em fila e será sincronizado quando voltar a estar online.",
    failure: "Não foi possível registar o movimento.",
    permissionDenied: "Não tem permissão para esta ação de inventário.",
    negativeStockBlocked: "Stock disponível insuficiente na localização selecionada.",
    quantityRequired: "Introduza uma quantidade superior a zero.",
    locationRequired: "Selecione uma localização.",
    destinationRequired: "Selecione a localização de destino.",
    transferSameLocation: "A origem e o destino devem ser diferentes.",
    confirmTitle: "Confirmar movimento",
    confirmReceipt: "Entrada de",
    confirmIssue: "Saída de",
    confirmTransfer: "Transferência de",
    lookupHint: "Consulte níveis de stock sem registar movimento."
  },
  unknown: {
    title: "Código desconhecido",
    scannedCode: "Código lido",
    message: "Este código não está associado a nenhum artigo ativo neste inquilino.",
    registrationNote: "Nunca são criados artigos automaticamente a partir de leituras desconhecidas.",
    searchPlaceholder: "Pesquisar inventário por nome ou referência",
    useSelected: "Usar apenas nesta sessão",
    noSearchResults: "Sem artigos correspondentes.",
    linkBarcode: "Associar código ao artigo selecionado",
    linkSuccess: "Código associado ao artigo.",
    linkFailure: "Não foi possível associar o código.",
    linkPermissionDenied: "Apenas utilizadores autorizados podem associar códigos permanentemente.",
    sessionOnly: "Seleção apenas para esta sessão — o código não é guardado."
  },
  ambiguous: {
    title: "Código ambíguo",
    scannedCode: "Código lido",
    message: "Existem vários códigos ativos iguais. Resolva os duplicados no inventário antes de voltar a ler.",
    matchCount: "registos correspondentes",
    rescan: "Ler outro código"
  },
  offline: {
    pendingTitle: "Sincronização pendente",
    pendingCount: "movimentos à espera de sincronização",
    syncing: "A sincronizar movimentos em fila…",
    syncNow: "Sincronizar agora",
    failedTitle: "Falhas de sincronização",
    retry: "Tentar novamente",
    offlineNotice: "Está offline. Os movimentos confirmados ficam em fila até haver ligação."
  },
  desktop: {
    openScanner: "Leitor móvel",
    recentMovements: "Movimentos recentes de stock",
    movementReason: "Motivo",
    movementWhen: "Quando"
  }
};

export function getInventoryMobileCopy(locale: Locale): InventoryMobileCopy {
  return locale === "pt-PT" ? ptPT : en;
}
