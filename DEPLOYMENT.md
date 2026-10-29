# 🚀 Deployment - Hop

## Status: ✅ PRONTO PARA PRODUÇÃO

- ✅ Dependências instaladas
- ✅ Testes passando (7/7)
- ✅ Icons criados
- ✅ Repositório Git inicializado
- ✅ GitHub Actions configurado

---

## Opção 1: Deploy via GitHub (Recomendado)

### 1.1 Criar repositório no GitHub

```powershell
# Acesse https://github.com/new
# Nome: hop
# Descrição: AirDrop-style file transfer for Mac and Windows
# Visibilidade: Public
# Clique Create
```

### 1.2 Push para GitHub

```powershell
cd C:\Users\teteu\Documents\Hop

# Substituir SEU_USERNAME com seu username do GitHub
git remote add origin https://github.com/SEU_USERNAME/hop.git
git branch -M main
git push -u origin main
```

### 1.3 Criar Release (dispara build automático)

```powershell
git tag v1.0.0
git push origin v1.0.0

# Esperar ~10 minutos
# GitHub Actions vai gerar:
# - Hop-mac-arm64.dmg
# - Hop-mac-x64.dmg
# - Hop-windows-x64.exe
```

✅ Os builds estarão em: https://github.com/SEU_USERNAME/hop/releases

---

## Opção 2: Build Local (Para testar agora)

### 2.1 Build para seu SO

```powershell
cd C:\Users\teteu\Documents\Hop

# Windows
npm run build:win

# Resultado em: dist/Hop-windows-x64.exe
```

### 2.2 Instalar localmente

```powershell
# Executar o .exe gerado
dist\Hop-windows-x64.exe

# Ou rodar em desenvolvimento
npm start
```

---

## Opção 3: Instalação Manual (Desenvolvimento)

```powershell
cd C:\Users\teteu\Documents\Hop

# 1. Instalar dependências (já feito)
npm install

# 2. Rodar testes
npm test

# 3. Iniciar aplicação
npm start

# 4. Em outro computador/máquina virtual (mesma rede Wi-Fi)
# Rodar o mesmo comando ou instalar via releases
```

---

## Instruções de Instalação (Para Usuários)

### Windows

1. Download: `Hop-windows-x64.exe` de https://github.com/SEU_USERNAME/hop/releases
2. Clique duplo para instalar
3. Escolha pasta de instalação
4. Clique "Next" para completar
5. Abra pelo Start Menu

### macOS (Apple Silicon)

1. Download: `Hop-mac-arm64.dmg`
2. Abra o .dmg
3. Arraste `Hop.app` para `Applications`
4. Abra Applications e clique em Hop
5. Na primeira vez, clique "Open" (prompt de segurança)

### macOS (Intel)

1. Download: `Hop-mac-x64.dmg`
2. (Mesmo processo que Apple Silicon acima)

---

## Usando Hop

### Descoberta Automática
- Abra em 2 máquinas na mesma Wi-Fi
- Espere 5 segundos - peers aparecerão no radar
- Ambas máquinas devem ter a porta 47800 (UDP) aberta

### Transferência
1. Clique no peer no radar
2. Selecione arquivos/pastas
3. Clique "Send"
4. Receptor vê janela "Accept/Decline"
5. Clique "Accept"
6. Arquivos baixam em `~/Downloads/Hop/`

### Trusted Devices
- Marque "Always accept from this device"
- Próximas transferências são automáticas
- Devices confiáveis salvos em `~/.hop-trust`

---

## Troubleshooting

### Devices não aparecem
```
1. Verificar Wi-Fi (mesma rede)
2. Verificar firewall (porta 47800 UDP)
3. Reiniciar app
```

### Arquivo não transfere
```
1. Verificar espaço em disco
2. Verificar permissões na pasta Downloads/Hop
3. Rodar com: npm start --dev (ver logs)
```

### Build falha no GitHub Actions
```
1. Acesse: Settings → Actions → Workflows
2. Clique na run que falhou
3. Veja logs para encontrar erro
4. Commit fix e push novo tag
```

---

## Próximas Features (Roadmap)

- [ ] Suporte a WebRTC (sem rede local)
- [ ] Sincronização automática de pastas
- [ ] Histórico de transferências
- [ ] Notificações do sistema
- [ ] Suporte a Linux
- [ ] Interface web (não-Electron)

---

## Contato & Suporte

- Issues: https://github.com/SEU_USERNAME/hop/issues
- Email: mferreira.nina@gmail.com
- Twitter: [@0xMovez](https://twitter.com/0xMovez) (inspiração original)

---

**Hop v1.0.0** - Built with Claude AI
