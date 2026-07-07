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
    category: string;
    currentStock: string;
    unit: string;
    location: string;
    reorderLevel: string;
    lowStock: string;
    stockOk: string;
    recentMovements: string;
    noMovements: string;
    movementTypes: {
      receipt: string;
      consumption: string;
      adjustment: string;
    };
  };
  transaction: {
    typeReceipt: string;
    typeConsumption: string;
    typeAdjustment: string;
    quantity: string;
    reason: string;
    reference: string;
    lotNote: string;
    adjustmentModeDelta: string;
    adjustmentModeTarget: string;
    targetBalance: string;
    deltaHint: string;
    targetHint: string;
    confirm: string;
    cancel: string;
    submitting: string;
    success: string;
    failure: string;
    negativeStockBlocked: string;
    quantityRequired: string;
    reasonRequired: string;
    confirmTitle: string;
    confirmReceipt: string;
    confirmConsumption: string;
    confirmAdjustment: string;
  };
  unknown: {
    title: string;
    scannedCode: string;
    message: string;
    registrationNote: string;
    searchPlaceholder: string;
    selectItem: string;
    useSelected: string;
    noSearchResults: string;
  };
  desktop: {
    totalActive: string;
    lowStockCount: string;
    reorderStatus: string;
    statusColumn: string;
    lowStockBadge: string;
    stockOkBadge: string;
    openScanner: string;
    recentMovements: string;
    consumeStock: string;
    adjustStock: string;
    viewMovements: string;
    movementQuantity: string;
    movementBalance: string;
    movementReason: string;
    movementWhen: string;
  };
};

const en: InventoryMobileCopy = {
  scanner: {
    title: "Scan barcode",
    description: "Scan an internal SKU barcode or enter the code manually.",
    backToInventory: "Back to inventory",
    scanArea: "Align the barcode inside the frame",
    scanStatus: {
      idle: "Ready to scan",
      scanning: "Scanning…",
      detected: "Code detected",
      resolving: "Looking up item…",
      permissionDenied: "Camera access was denied. Use manual entry below or allow camera access in browser settings.",
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
    barcode: "SKU / barcode",
    category: "Category",
    currentStock: "Current stock",
    unit: "Unit",
    location: "Warehouse location",
    reorderLevel: "Reorder level",
    lowStock: "Low stock",
    stockOk: "Stock OK",
    recentMovements: "Recent movements",
    noMovements: "No movements recorded yet.",
    movementTypes: {
      receipt: "Receipt",
      consumption: "Consumption",
      adjustment: "Adjustment"
    }
  },
  transaction: {
    typeReceipt: "Receipt",
    typeConsumption: "Consumption",
    typeAdjustment: "Adjustment",
    quantity: "Quantity",
    reason: "Reason",
    reference: "Reference (optional)",
    lotNote: "Lot / batch note (optional)",
    adjustmentModeDelta: "Add or subtract quantity",
    adjustmentModeTarget: "Set balance to",
    targetBalance: "Target balance",
    deltaHint: "Positive adds stock; negative removes stock.",
    targetHint: "Sets the balance to this exact quantity.",
    confirm: "Confirm and post",
    cancel: "Cancel",
    submitting: "Posting…",
    success: "Stock updated successfully.",
    failure: "Could not post stock change.",
    negativeStockBlocked: "Not enough stock for this consumption.",
    quantityRequired: "Enter a quantity greater than zero.",
    reasonRequired: "A reason is required for adjustments.",
    confirmTitle: "Confirm stock change",
    confirmReceipt: "Record receipt of",
    confirmConsumption: "Record consumption of",
    confirmAdjustment: "Apply stock adjustment"
  },
  unknown: {
    title: "Unknown barcode",
    scannedCode: "Scanned code",
    message: "This code is not registered for any active inventory item in this tenant.",
    registrationNote:
      "Permanent barcode registration requires authorised review. You may select an existing item for this operation only.",
    searchPlaceholder: "Search inventory by name or SKU",
    selectItem: "Select item",
    useSelected: "Use selected item",
    noSearchResults: "No matching items."
  },
  desktop: {
    totalActive: "Active items",
    lowStockCount: "Low stock",
    reorderStatus: "Reorder",
    statusColumn: "Status",
    lowStockBadge: "Low",
    stockOkBadge: "OK",
    openScanner: "Mobile scanner",
    recentMovements: "Recent stock movements",
    consumeStock: "Record consumption",
    adjustStock: "Adjust stock",
    viewMovements: "Movements",
    movementQuantity: "Qty",
    movementBalance: "Balance",
    movementReason: "Reason",
    movementWhen: "When"
  }
};

const ptPT: InventoryMobileCopy = {
  scanner: {
    title: "Ler código de barras",
    description: "Leia o código interno do SKU ou introduza o código manualmente.",
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
    barcode: "SKU / código",
    category: "Categoria",
    currentStock: "Stock atual",
    unit: "Unidade",
    location: "Localização",
    reorderLevel: "Nível de reposição",
    lowStock: "Stock baixo",
    stockOk: "Stock OK",
    recentMovements: "Movimentos recentes",
    noMovements: "Ainda sem movimentos registados.",
    movementTypes: {
      receipt: "Entrada",
      consumption: "Consumo",
      adjustment: "Ajuste"
    }
  },
  transaction: {
    typeReceipt: "Entrada",
    typeConsumption: "Consumo",
    typeAdjustment: "Ajuste",
    quantity: "Quantidade",
    reason: "Motivo",
    reference: "Referência (opcional)",
    lotNote: "Nota de lote (opcional)",
    adjustmentModeDelta: "Adicionar ou subtrair quantidade",
    adjustmentModeTarget: "Definir saldo para",
    targetBalance: "Saldo alvo",
    deltaHint: "Positivo adiciona stock; negativo remove stock.",
    targetHint: "Define o saldo para esta quantidade exata.",
    confirm: "Confirmar e registar",
    cancel: "Cancelar",
    submitting: "A registar…",
    success: "Stock atualizado com sucesso.",
    failure: "Não foi possível registar a alteração de stock.",
    negativeStockBlocked: "Stock insuficiente para este consumo.",
    quantityRequired: "Introduza uma quantidade superior a zero.",
    reasonRequired: "É obrigatório indicar um motivo para ajustes.",
    confirmTitle: "Confirmar alteração de stock",
    confirmReceipt: "Registar entrada de",
    confirmConsumption: "Registar consumo de",
    confirmAdjustment: "Aplicar ajuste de stock"
  },
  unknown: {
    title: "Código desconhecido",
    scannedCode: "Código lido",
    message: "Este código não está associado a nenhum artigo ativo neste inquilino.",
    registrationNote:
      "O registo permanente de códigos requer revisão autorizada. Pode selecionar um artigo existente apenas para esta operação.",
    searchPlaceholder: "Pesquisar inventário por nome ou SKU",
    selectItem: "Selecionar artigo",
    useSelected: "Usar artigo selecionado",
    noSearchResults: "Sem artigos correspondentes."
  },
  desktop: {
    totalActive: "Artigos ativos",
    lowStockCount: "Stock baixo",
    reorderStatus: "Reposição",
    statusColumn: "Estado",
    lowStockBadge: "Baixo",
    stockOkBadge: "OK",
    openScanner: "Leitor móvel",
    recentMovements: "Movimentos recentes de stock",
    consumeStock: "Registar consumo",
    adjustStock: "Ajustar stock",
    viewMovements: "Movimentos",
    movementQuantity: "Qtd",
    movementBalance: "Saldo",
    movementReason: "Motivo",
    movementWhen: "Quando"
  }
};

export function getInventoryMobileCopy(locale: Locale): InventoryMobileCopy {
  return locale === "pt-PT" ? ptPT : en;
}
