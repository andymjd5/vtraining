// scripts/test-ai-providers.mjs
// Script pour tester les différents providers IA

import { aiService } from '../src/services/aiService.js';
import { getAvailableProviders, setAIProvider } from '../src/config/ai.js';

async function testProvider(providerName) {
    console.log(`\n🧪 Test du provider: ${providerName}`);
    console.log('━'.repeat(50));

    try {
        setAIProvider(providerName);

        const testContent = `
        Les variables en JavaScript sont des conteneurs pour stocker des données.
        Il existe trois mots-clés pour déclarer des variables : var, let, et const.
        
        - var : portée de fonction, peut être redéclarée
        - let : portée de bloc, ne peut pas être redéclarée dans le même scope
        - const : portée de bloc, valeur constante
        `;

        console.log('📤 Envoi de la requête...');
        const start = Date.now();

        const questions = await aiService.generateQuizQuestions(testContent, 2, {
            difficulty: 'easy',
            language: 'français'
        });

        const duration = Date.now() - start;

        console.log(`✅ Succès en ${duration}ms`);
        console.log(`📊 Questions générées: ${questions.length}`);

        questions.forEach((q, i) => {
            console.log(`\nQuestion ${i + 1}: ${q.question}`);
            console.log(`Options: ${q.options.join(', ')}`);
            console.log(`Réponse: ${q.options[q.answer]} (index ${q.answer})`);
        });

        return true;

    } catch (error) {
        console.log(`❌ Échec: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Test du système IA multi-provider VTraining');
    console.log('='.repeat(60));

    const providers = getAvailableProviders();
    const results = {};

    for (const { provider, name, configured } of providers) {
        if (configured) {
            results[provider] = await testProvider(provider);
        } else {
            console.log(`\n⚠️  Provider ${name} (${provider}) non configuré - ignoré`);
            results[provider] = null;
        }
    }

    console.log('\n📋 Résumé des tests');
    console.log('═'.repeat(60));

    Object.entries(results).forEach(([provider, result]) => {
        const status = result === true ? '✅ OK' : result === false ? '❌ FAIL' : '⚠️  SKIP';
        console.log(`${provider.padEnd(12)} : ${status}`);
    });

    const successCount = Object.values(results).filter(r => r === true).length;
    const totalConfigured = Object.values(results).filter(r => r !== null).length;

    console.log(`\n🎯 Résultat final: ${successCount}/${totalConfigured} providers fonctionnels`);

    if (successCount === 0) {
        console.log('\n❗ Aucun provider IA n\'est fonctionnel.');
        console.log('💡 Vérifiez vos clés API dans le fichier .env');
        process.exit(1);
    } else {
        console.log('\n🎉 Le système IA est opérationnel !');
        process.exit(0);
    }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
    console.error('\n💥 Erreur non gérée:', error);
    process.exit(1);
});

main().catch(console.error);
