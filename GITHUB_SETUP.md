# GitHub Setup para Hop

## Passo 1: Criar Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome: `hop`
3. Descrição: "AirDrop-style file transfer for Mac and Windows"
4. Visibilidade: Public
5. **Não** initialize com README (já temos um)
6. Clique "Create repository"

## Passo 2: Adicionar Remote

```powershell
cd C:\Users\teteu\Documents\Hop

# Adicione seu username do GitHub aqui:
git remote add origin https://github.com/SEUSEUUSERNAME/hop.git

# Renomear branch master para main
git branch -M main

# Push para GitHub
git push -u origin main
```

## Passo 3: Configurar GitHub Actions

1. Acesse **Settings** → **Actions** → **General**
2. Ative "Read and write permissions"
3. O arquivo `.github/workflows/build.yml` já está configurado

## Passo 4: Criar primeira Release

```powershell
cd C:\Users\teteu\Documents\Hop

# Criar tag v1.0.0
git tag v1.0.0

# Push tag (dispara build automático)
git push origin v1.0.0
```

GitHub Actions vai:
- ✅ Rodar testes
- ✅ Build Hop-mac-arm64.dmg
- ✅ Build Hop-mac-x64.dmg
- ✅ Build Hop-windows-x64.exe
- ✅ Publicar em Releases

## Instruções de Instalação Finais

### Para macOS
```bash
# Download Hop-mac-arm64.dmg (Apple Silicon) ou Hop-mac-x64.dmg (Intel)
# Abra o .dmg e arraste Hop.app para Applications
# Abra Applications e clique em Hop
```

### Para Windows
```bash
# Download Hop-windows-x64.exe
# Execute o instalador
# Escolha a pasta de instalação
# Clique "Next" até terminar
# Abra Hop via Start Menu
```

## Troubleshooting GitHub Actions

Se o build falhar:

1. **Acesse Runs**: Settings → Actions → Workflows → "Build Hop"
2. **Veja logs**: Clique no run falho e veja a saída
3. **Problemas comuns**:
   - Node.js não encontrado: Verificar setup-node action
   - npm install falha: Verificar dependências em package.json
   - Código não encontrado: Verificar paths em build.yml

## Próximos Passos

```powershell
# Para desenvolver localmente:
npm start              # Run app
npm test               # Run tests
npm run build          # Build para seu OS

# Quando estiver pronto para release:
git tag v1.0.1
git push origin v1.0.1
# → GitHub Actions fará o build automaticamente
```
