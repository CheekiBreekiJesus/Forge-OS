# ForgeOS — Resolução de problemas local (JH Gomes)

## O ForgeOS não abre no browser

1. Confirme que executou `Start-ForgeOS-Local.cmd` ou `Start-ForgeOS-Local.ps1`
2. Aguarde a mensagem «pronto» no terminal
3. Abra manualmente: **http://localhost:3000**
4. Se não funcionar, execute `Stop-ForgeOS.cmd` e inicie novamente

## Mensagem «Port 3000 is already in use»

Outra aplicação está a usar a porta 3000.

1. Execute `Stop-ForgeOS.ps1`
2. Se o erro continuar, feche outras aplicações de desenvolvimento web
3. Reinicie o computador se necessário
4. Inicie o ForgeOS outra vez

O script indica qual processo está a usar a porta. **Não termine todos os processos Node** manualmente — use apenas `Stop-ForgeOS.ps1`.

## «Node.js is not installed»

1. Instale Node.js 20 LTS em [https://nodejs.org/](https://nodejs.org/)
2. Feche e reabra o terminal
3. Execute novamente `Setup-ForgeOS.ps1`

## «Unsupported Node.js major version»

Instale Node.js **versão 20 ou 22** (versão LTS recomendada).

## «Dependencies are not installed»

Execute a configuração inicial:

```powershell
.\scripts\customer-pc\Setup-ForgeOS.ps1
```

## Os dados desapareceram

Causas frequentes:

- Utilizou modo InPrivate/Incógnito
- Limpou os dados do site no browser
- Abriu `http://127.0.0.1:3000` em vez de `http://localhost:3000`
- Alterou o nome da base de dados em `.env.local`

**Solução:** Restaure a cópia de segurança JSON em Definições → Cópia de segurança → Importar.

## A aplicação abre mas está vazia ou com erros após atualização

1. Pare o ForgeOS
2. Importe a última cópia de segurança JSON
3. Se não resolver, contacte o programador com o ZIP de diagnósticos

## Erro durante atualização

O script de atualização não apaga `.env.local` nem dados do browser.

Para reverter manualmente, consulte [Atualização e reversão (EN)](customer-pc-update-and-rollback.md) ou peça apoio ao programador.

## Recolher diagnósticos (sem dados privados)

```powershell
.\scripts\customer-pc\Collect-ForgeOS-Diagnostics.ps1
```

O script mostra os ficheiros incluídos antes de criar o ZIP.

**Nunca incluído:** `.env.local`, tokens, mensagens de email, dados de clientes.

## Verificar se o ForgeOS está a responder

Com o ForgeOS a correr, abra no browser:

http://localhost:3000/api/health/local

Deve ver um JSON com `"status":"ok"`.

## Contacto com o programador

Envie:

1. Ficheiro ZIP de diagnósticos
2. Captura de ecrã do terminal
3. Passos que executou antes do erro

Não envie `.env.local` nem dados de leads/clientes.
