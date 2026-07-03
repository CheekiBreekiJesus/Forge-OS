# ForgeOS — Guia rápido local (JH Gomes)

Este guia é para utilização no computador da JH Gomes **sem conhecimentos de programação**.

## O que precisa

- Windows 10 ou superior
- Node.js 20 ou 22 ([https://nodejs.org/](https://nodejs.org/))
- Microsoft Edge ou Google Chrome
- A pasta do ForgeOS no computador

## Primeira utilização

### 1. Abrir a pasta do ForgeOS

Abra a pasta onde o ForgeOS foi copiado ou instalado.

### 2. Executar a configuração inicial (apenas uma vez)

1. Clique com o botão direito na pasta `scripts\customer-pc`
2. Escolha **Abrir no Terminal** (ou abra o PowerShell nessa pasta)
3. Execute:

```powershell
.\Setup-ForgeOS.ps1
```

Aguarde até aparecer a mensagem de configuração concluída. A configuração inicial também executa a **primeira compilação** do ForgeOS para arranques diários mais rápidos.

### 3. Iniciar o ForgeOS (utilização diária)

Faça duplo clique em:

`scripts\customer-pc\Start-ForgeOS-Local.cmd`

Ou execute:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Local.ps1
```

O arranque diário **reutiliza** a compilação existente quando corresponde ao commit atual. Para forçar nova compilação:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Local.ps1 -Rebuild
```

### 4. Aguardar a mensagem de pronto

O terminal indica quando o ForgeOS está pronto. O browser abre automaticamente.

### 5. Utilizar sempre este endereço

**http://localhost:3000**

Não utilize `127.0.0.1` nem outra porta.

### 6. Manter o terminal aberto

Enquanto utiliza o ForgeOS, **não feche a janela do terminal** onde o programa está a correr.

### 7. Parar o ForgeOS

Antes de desligar o computador ou atualizar o programa:

- Duplo clique em `scripts\customer-pc\Stop-ForgeOS.cmd`, ou
- Execute `.\scripts\customer-pc\Stop-ForgeOS.ps1`

## Cópia de segurança (importante)

Antes de qualquer atualização:

1. Abra o ForgeOS em http://localhost:3000
2. Vá a **Definições** → **Cópia de segurança**
3. Clique em **Exportar** e guarde o ficheiro JSON num local seguro

## Regras do browser (muito importantes)

| Faça | Não faça |
|------|----------|
| Utilize sempre http://localhost:3000 | Não utilize modo InPrivate/Incógnito |
| Utilize o mesmo browser habitual | Não limpe os dados do site localhost |
| Exporte cópia de segurança antes de atualizar | Não misture localhost com 127.0.0.1 |

Os dados da aplicação ficam guardados no browser deste computador. Se limpar os dados do site, **perde os dados locais**.

## Atalhos no ambiente de trabalho (opcional)

Execute uma vez:

```powershell
.\scripts\customer-pc\Create-ForgeOS-Shortcuts.ps1
```

Cria atalhos para Iniciar, Parar e Abrir o ForgeOS.

## Modo de testes para programador (opcional)

Para testes com recarregamento automático:

```powershell
.\scripts\customer-pc\Start-ForgeOS-Dev.ps1
```

## Atualizações

As atualizações usam o ramo configurado em `.env.local`:

`FORGEOS_UPDATE_BRANCH=deploy/jh-gomes-local`

Este ramo será criado após a integração. Consulte [Atualização e reversão (EN)](customer-pc-update-and-rollback.md).

## Se algo correr mal

Consulte [Resolução de problemas](jh-gomes-local-troubleshooting-pt.md).

Para enviar informação ao programador:

```powershell
.\scripts\customer-pc\Collect-ForgeOS-Diagnostics.ps1
```

Envie o ficheiro ZIP gerado (não contém palavras-passe).

## O que enviar ao programador em caso de erro

1. O ficheiro ZIP das diagnósticas (comando acima)
2. Uma captura de ecrã da mensagem de erro no terminal
3. A hora em que o erro aconteceu
4. O que estava a fazer quando o erro apareceu
5. Confirme se exportou cópia de segurança recentemente

**Não envie** o ficheiro `.env.local` nem capturas com dados de clientes.
