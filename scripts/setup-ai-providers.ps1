# scripts/setup-ai-providers.ps1
# Script PowerShell pour configurer les providers IA

param(
    [switch]$Interactive,
    [string]$Provider,
    [string]$ApiKey
)

Write-Host "🚀 Configuration des Providers IA - VTraining" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Fonction pour vérifier si .env existe
function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Host "📁 Fichier .env non trouvé. Création à partir de .env.example..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ Fichier .env créé avec succès" -ForegroundColor Green
        } else {
            Write-Host "❌ Fichier .env.example non trouvé" -ForegroundColor Red
            exit 1
        }
    }
}

# Fonction pour ajouter/modifier une variable dans .env
function Set-EnvVariable {
    param($Name, $Value)
    
    $envContent = Get-Content ".env" -Raw
    $pattern = "^$Name=.*$"
    $replacement = "$Name=$Value"
    
    if ($envContent -match $pattern) {
        $envContent = $envContent -replace $pattern, $replacement
        Write-Host "🔄 Variable $Name mise à jour" -ForegroundColor Blue
    } else {
        $envContent += "`n$replacement"
        Write-Host "➕ Variable $Name ajoutée" -ForegroundColor Green
    }
    
    $envContent | Set-Content ".env"
}

# Fonction pour obtenir une clé API de manière interactive
function Get-ApiKeyInteractive {
    param($ProviderName, $VarName, $Url)
    
    Write-Host "`n🔑 Configuration de $ProviderName" -ForegroundColor Yellow
    Write-Host "Site web: $Url" -ForegroundColor Gray
    Write-Host "Variable: $VarName" -ForegroundColor Gray
    
    $apiKey = Read-Host "Entrez votre clé API (ou appuyez sur Entrée pour ignorer)"
    
    if ($apiKey -and $apiKey.Trim() -ne "") {
        Set-EnvVariable $VarName $apiKey.Trim()
        return $true
    }
    return $false
}

# Informations sur les providers
$providers = @{
    "deepseek" = @{
        Name = "Deepseek"
        Var = "VITE_DEEPSEEK_API_KEY"
        Url = "https://platform.deepseek.com/"
        Description = "Recommandé - Excellent rapport qualité/prix"
    }
    "openai" = @{
        Name = "OpenAI"
        Var = "VITE_OPENAI_API_KEY" 
        Url = "https://platform.openai.com/api-keys"
        Description = "ChatGPT - Très fiable mais plus cher"
    }
    "anthropic" = @{
        Name = "Anthropic"
        Var = "VITE_ANTHROPIC_API_KEY"
        Url = "https://console.anthropic.com/"
        Description = "Claude - Bon pour les tâches éducatives"
    }
    "gemini" = @{
        Name = "Google Gemini"
        Var = "VITE_GEMINI_API_KEY"
        Url = "https://ai.google.dev/"
        Description = "Quota gratuit généreux"
    }
}

# Vérifier et créer le fichier .env
Test-EnvFile

if ($Interactive) {
    Write-Host "`n🎯 Configuration interactive des providers IA" -ForegroundColor Cyan
    Write-Host "Vous pouvez configurer un ou plusieurs providers selon vos besoins.`n"
    
    $configured = 0
    foreach ($key in $providers.Keys) {
        $provider = $providers[$key]
        Write-Host "Provider: $($provider.Name)" -ForegroundColor White
        Write-Host "Description: $($provider.Description)" -ForegroundColor Gray
        
        if (Get-ApiKeyInteractive $provider.Name $provider.Var $provider.Url) {
            $configured++
        }
    }
    
    # Configuration du provider par défaut
    if ($configured -gt 0) {
        Write-Host "`n🎯 Sélection du provider par défaut" -ForegroundColor Yellow
        Write-Host "Providers disponibles:" -ForegroundColor Gray
        
        $i = 1
        $validProviders = @()
        foreach ($key in $providers.Keys) {
            Write-Host "$i. $($providers[$key].Name) ($key)" -ForegroundColor Gray
            $validProviders += $key
            $i++
        }
        
        do {
            $choice = Read-Host "Choisissez le provider par défaut (1-$($validProviders.Count))"
            $choiceNum = [int]$choice
        } while ($choiceNum -lt 1 -or $choiceNum -gt $validProviders.Count)
        
        $defaultProvider = $validProviders[$choiceNum - 1]
        Set-EnvVariable "VITE_AI_PROVIDER" $defaultProvider
        
        Write-Host "`n✅ Configuration terminée!" -ForegroundColor Green
        Write-Host "Provider par défaut: $($providers[$defaultProvider].Name)" -ForegroundColor Green
        Write-Host "Providers configurés: $configured" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Aucun provider configuré" -ForegroundColor Yellow
        Write-Host "💡 Vous devez configurer au moins un provider pour utiliser l'IA" -ForegroundColor Yellow
    }
    
} elseif ($Provider -and $ApiKey) {
    # Configuration en ligne de commande
    if ($providers.ContainsKey($Provider.ToLower())) {
        $providerInfo = $providers[$Provider.ToLower()]
        Set-EnvVariable $providerInfo.Var $ApiKey
        Set-EnvVariable "VITE_AI_PROVIDER" $Provider.ToLower()
        Write-Host "✅ Provider $($providerInfo.Name) configuré avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Provider '$Provider' non reconnu" -ForegroundColor Red
        Write-Host "Providers supportés: $($providers.Keys -join ', ')" -ForegroundColor Gray
        exit 1
    }
    
} else {
    # Affichage de l'aide
    Write-Host "`n📖 Utilisation:" -ForegroundColor White
    Write-Host "Configuration interactive:" -ForegroundColor Gray
    Write-Host "  .\setup-ai-providers.ps1 -Interactive" -ForegroundColor Yellow
    Write-Host "`nConfiguration directe:" -ForegroundColor Gray
    Write-Host "  .\setup-ai-providers.ps1 -Provider deepseek -ApiKey sk-xxxx" -ForegroundColor Yellow
    
    Write-Host "`n🔧 Providers supportés:" -ForegroundColor White
    foreach ($key in $providers.Keys) {
        $provider = $providers[$key]
        Write-Host "  $key - $($provider.Name)" -ForegroundColor Gray
        Write-Host "    $($provider.Description)" -ForegroundColor DarkGray
        Write-Host "    Site: $($provider.Url)" -ForegroundColor DarkGray
        Write-Host ""
    }
}

Write-Host "`n💡 Conseils:" -ForegroundColor White
Write-Host "• Configurez Deepseek en premier (meilleur rapport qualité/prix)" -ForegroundColor Gray
Write-Host "• Vous pouvez configurer plusieurs providers pour la redondance" -ForegroundColor Gray
Write-Host "• Le système basculera automatiquement en cas d'échec" -ForegroundColor Gray
Write-Host "• Testez avec: npm run test:ai" -ForegroundColor Gray
