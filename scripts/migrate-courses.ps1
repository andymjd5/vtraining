# migrate-courses.ps1
# Script PowerShell pour faciliter l'exécution des scripts de migration de la phase 4

Write-Host "=====================================================" -ForegroundColor Blue
Write-Host "  VTraining - Phase 4 : Migration des Cours" -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue

# Vérifier si nous sommes dans le répertoire du projet
if (-not (Test-Path -Path "./package.json" -PathType Leaf)) {
    Write-Host "Erreur: Ce script doit être exécuté à la racine du projet VTraining." -ForegroundColor Red
    Write-Host "Veuillez naviguer vers le répertoire racine du projet et réessayer." -ForegroundColor Yellow
    exit 1
}

function Show-Menu {
    Write-Host "`nOptions disponibles:" -ForegroundColor Cyan
    Write-Host "1. Exécuter la migration des cours" -ForegroundColor White
    Write-Host "2. Valider les données migrées" -ForegroundColor White
    Write-Host "3. Identifier les scripts obsolètes" -ForegroundColor White
    Write-Host "4. Marquer les scripts obsolètes" -ForegroundColor White
    Write-Host "5. Voir le résumé de la migration" -ForegroundColor White
    Write-Host "6. Quitter" -ForegroundColor White
    
    $choice = Read-Host "`nEntrez votre choix (1-6)"
    return $choice
}

function Run-Migration {
    Write-Host "`nExécution de la migration des cours..." -ForegroundColor Yellow
    node scripts/migrateCourses.mjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration terminée avec succès!" -ForegroundColor Green
    } else {
        Write-Host "La migration a échoué avec le code d'erreur $LASTEXITCODE" -ForegroundColor Red
    }
    
    Read-Host "`nAppuyez sur Entrée pour continuer"
}

function Validate-Migration {
    Write-Host "`nValidation des données migrées..." -ForegroundColor Yellow
    node scripts/validateMigration.mjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Validation terminée!" -ForegroundColor Green
    } else {
        Write-Host "La validation a échoué avec le code d'erreur $LASTEXITCODE" -ForegroundColor Red
    }
    
    Read-Host "`nAppuyez sur Entrée pour continuer"
}

function Identify-ObsoleteScripts {
    Write-Host "`nIdentification des scripts obsolètes..." -ForegroundColor Yellow
    
    # Liste des scripts obsolètes
    $obsoleteScripts = @(
        @{Path="scripts/initializeFirestoreCourses.mjs"; Reason="Utilise l'ancienne structure de données imbriquée"},
        @{Path="scripts/initializeFirestoreData.mjs"; Reason="Utilise l'ancienne structure de données imbriquée"},
        @{Path="src/scripts/createProgressTracking.js"; Reason="Fait référence à la structure imbriquée des chapitres"},
        @{Path="src/scripts/initializeFirebaseData.js"; Reason="Utilise l'ancienne structure de données imbriquée"}
    )
    
    Write-Host "`nScripts obsolètes identifiés:" -ForegroundColor Red
    foreach ($script in $obsoleteScripts) {
        $scriptPath = $script.Path
        $exists = Test-Path -Path $scriptPath -PathType Leaf
        $status = if ($exists) { "" } else { "(NON TROUVÉ)" }
        
        Write-Host "- $scriptPath $status" -ForegroundColor Red
        Write-Host "  Raison: $($script.Reason)" -ForegroundColor Yellow
    }
    
    Read-Host "`nAppuyez sur Entrée pour continuer"
}

function Mark-ObsoleteScripts {
    Write-Host "`nMarquage des scripts obsolètes..." -ForegroundColor Yellow
    
    # Liste des scripts obsolètes
    $obsoleteScripts = @(
        @{Path="scripts/initializeFirestoreCourses.mjs"; Reason="Utilise l'ancienne structure de données imbriquée"},
        @{Path="scripts/initializeFirestoreData.mjs"; Reason="Utilise l'ancienne structure de données imbriquée"},
        @{Path="src/scripts/createProgressTracking.js"; Reason="Fait référence à la structure imbriquée des chapitres"},
        @{Path="src/scripts/initializeFirebaseData.js"; Reason="Utilise l'ancienne structure de données imbriquée"}
    )
    
    $confirmation = Read-Host "Êtes-vous sûr de vouloir marquer ces scripts comme obsolètes? (o/n)"
    
    if ($confirmation -eq "o" -or $confirmation -eq "O" -or $confirmation -eq "oui") {
        foreach ($script in $obsoleteScripts) {
            $scriptPath = $script.Path
            
            if (Test-Path -Path $scriptPath -PathType Leaf) {
                $content = Get-Content -Path $scriptPath -Raw
                $obsoleteComment = "// *** OBSOLETE ***`n// Ce script utilise l'ancienne structure de données et n'est plus compatible avec la nouvelle architecture modulaire.`n// Conservé uniquement pour référence historique. Veuillez utiliser les nouveaux scripts de migration.`n// Date de marquage: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
                $newContent = $obsoleteComment + $content
                
                # Créer une copie obsolète
                $obsoletePath = "$scriptPath.obsolete"
                $newContent | Out-File -FilePath $obsoletePath -Encoding utf8
                
                Write-Host "✓ $scriptPath → $obsoletePath" -ForegroundColor Green
            } else {
                Write-Host "⚠ $scriptPath n'existe pas" -ForegroundColor Yellow
            }
        }
        
        Write-Host "`nMarquage terminé!" -ForegroundColor Green
    } else {
        Write-Host "`nOpération annulée." -ForegroundColor Yellow
    }
    
    Read-Host "`nAppuyez sur Entrée pour continuer"
}

function Show-Summary {
    Write-Host "`nRésumé de la migration de la phase 4:" -ForegroundColor Cyan
    
    # Afficher le contenu du fichier de documentation
    if (Test-Path -Path "docs/phase4-migration.md" -PathType Leaf) {
        $content = Get-Content -Path "docs/phase4-migration.md" -Raw
        Write-Host $content
    } else {
        Write-Host "Le fichier de documentation 'docs/phase4-migration.md' n'a pas été trouvé." -ForegroundColor Red
    }
    
    Read-Host "`nAppuyez sur Entrée pour continuer"
}

# Boucle principale du menu
$exit = $false
while (-not $exit) {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" { Run-Migration }
        "2" { Validate-Migration }
        "3" { Identify-ObsoleteScripts }
        "4" { Mark-ObsoleteScripts }
        "5" { Show-Summary }
        "6" { $exit = $true }
        default { Write-Host "Choix invalide. Veuillez entrer un nombre entre 1 et 6." -ForegroundColor Red }
    }
}

Write-Host "Au revoir!" -ForegroundColor Cyan
