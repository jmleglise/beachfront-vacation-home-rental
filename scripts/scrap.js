// JML test scraping with pupeteer
// exec with node scrap.js  (s'appelait avant pupeteer.js)
// dans package.json ajouter dans la patie dependencies (et pas devdependencies) : 
//     "puppeteer": "^24.8.1",
//     "jsdom": "^26.1.0",

const puppeteer = require('puppeteer');
const fs = require('fs');

// Fonction pour formater les dates selon les besoins spécifiques
function formatDateRange(firstDateLiteral, lastDateLiteral) {
  if (!firstDateLiteral || !lastDateLiteral) {
    return 'Date non spécifiée';
  }
  
  // Extraction des dates (format attendu: "JJ/MM/AAAA HH:MM:SS")
  const firstParts = firstDateLiteral.split(' ')[0].split('/');
  const lastParts = lastDateLiteral.split(' ')[0].split('/');
  
  // Obtention du jour, mois, année pour les dates
  const firstDay = parseInt(firstParts[0]);
  const firstMonth = parseInt(firstParts[1]);
  const firstYear = parseInt(firstParts[2]);
  
  const lastDay = parseInt(lastParts[0]);
  const lastMonth = parseInt(lastParts[1]);
  const lastYear = parseInt(lastParts[2]);
  
  // Conversion des numéros de mois en noms
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  const firstMonthName = monthNames[firstMonth - 1];
  const lastMonthName = monthNames[lastMonth - 1];
  
  // Vérification si c'est le même jour
  if (firstDay === lastDay && firstMonth === lastMonth && firstYear === lastYear) {
    return `${firstDay} ${firstMonthName} ${firstYear}`;
  } else {
    return `${firstDay} ${firstMonthName} > ${lastDay} ${lastMonthName} ${lastYear}`;
  }
}

(async () => {
  // Lancer le navigateur
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      '--window-size=1200,800',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // Arguments pour éviter la détection de headless
      '--disable-blink-features=AutomationControlled'
    ],
    // Définir un user-agent standard pour éviter la détection de bot
    ignoreHTTPSErrors: true
  });
  
  const page = await browser.newPage();
  
  // Définir un user-agent réaliste
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36');
  
  // Utiliser le mode incognito pour éviter certaines restrictions
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
  });
  
  console.log('Configuration du navigateur terminée.');
  
  // Variable pour stocker la réponse de l'API
  let apiResponse = null;
  let responsePromise;
  
  // Surveiller tous les codes de statut HTTP
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    // Afficher tous les codes 403 (Forbidden)
    if (status === 403) {
      console.error(`⚠️ Code 403 détecté pour: ${url}`);
    }
    
    // Afficher les codes d'erreur pour les ressources importantes
    if (status >= 400 && (url.includes('algolia') || url.includes('infolocale') || url.includes('ouest-france'))) {
      console.error(`⚠️ Erreur HTTP ${status} pour: ${url}`);
    }
  });
  
  // Créer une promesse pour attendre la réponse API spécifique
  responsePromise = new Promise(resolve => {
    page.on('response', async response => {
      const url = response.url();
      
      // Vérifier si c'est la réponse de l'API Algolia
      if (url.includes('/1/indexes/*/queries?')) {
        try {
          const status = response.status();
          console.log(`Réponse API Algolia reçue avec code HTTP: ${status}`);
          
          if (status === 200) {
            apiResponse = await response.json();
            console.log('Réponse API interceptée avec succès!');
            resolve();
          } else {
            console.error(`⚠️ La requête API a échoué avec le code: ${status}`);
            // On résout quand même pour continuer le script même avec une erreur
            resolve();
          }
        } catch (error) {
          console.error('Erreur lors de l\'interception de la réponse:', error);
        }
      }
    });
  });
  
  // Configurer l'interception des requêtes (mais sans callback inutile)
  await page.setRequestInterception(true);
  page.on('request', request => request.continue());
  
  // Surveiller les erreurs de page
  page.on('pageerror', error => {
    console.error('Erreur dans la page:', error.message);
  });
  
  // Surveiller les erreurs de console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error:', msg.text());
    }
  });
  
  // Accéder à la page
  console.log('Accès à la page...');
  await page.goto('https://infolocale.ouest-france.fr/evenements?rubrique%5B0%5D=Concerts,%20spectacles%20%3E%20Concert,%20spectacle%20musical&rubrique%5B1%5D=Loisirs%20et%20sports%20%3E%20Acheter,%20chiner&rubrique%5B2%5D=Convivialit%C3%A9%20et%20partage%20%3E%20F%C3%AAte&rubrique%5B3%5D=Convivialit%C3%A9%20et%20partage%20%3E%20%C3%80%20table&rubrique%5B4%5D=Convivialit%C3%A9%20et%20partage%20%3E%20Danser&commune=14488', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  // Attendre la réponse API avec un timeout de sécurité
  console.log('Attente de la réponse API...');
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout: Aucune réponse API reçue')), 5000)
  );
  
  try {
    await Promise.race([responsePromise, timeoutPromise]);
  } catch (error) {
    console.error(error.message);
    
    // Ancienne logique de récupération (gardée en commentaire pour référence)
    // -----------------------------------------------------------------
    // // Tenter de déclencher une nouvelle requête en faisant défiler la page
    // console.log('Tentative de déclenchement d\'une nouvelle requête...');
    // await page.evaluate(() => window.scrollBy(0, 500));
    // 
    // try {
    //   // Attendre à nouveau avec un timeout plus court
    //   await Promise.race([
    //     responsePromise, 
    //     new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout final')), 3000))
    //   ]);
    // } catch (error) {
    //   console.error('Impossible d\'intercepter la réponse API. Fin du script.');
    //   await browser.close();
    //   process.exit(1);
    // }
    // -----------------------------------------------------------------
    
    console.error('Impossible d\'intercepter la réponse API. Fin du script.');
    await browser.close();
    process.exit(1);
  }
  
  // Sauvegarder la réponse complète pour référence (optionnel)
  if (apiResponse) {
    fs.writeFileSync('algolia_response_full.json', JSON.stringify(apiResponse, null, 2));
    console.log('Réponse API complète sauvegardée dans algolia_response_full.json');
  
    // Extraire les 5 premiers événements
    const events = [];
    
    if (apiResponse.results && apiResponse.results[0] && apiResponse.results[0].hits) {
      const hits = apiResponse.results[0].hits;
      const maxEvents = Math.min(hits.length, 5);
      
      for (let i = 0; i < maxEvents; i++) {
        const event = hits[i];
        
        // Utiliser les champs _date-first-literal et _date-last-literal pour la date
        const firstDateLiteral = event['_date-first-literal'];
        const lastDateLiteral = event['_date-last-literal'];
        const formattedDate = formatDateRange(firstDateLiteral, lastDateLiteral);
        
        // Créer l'objet événement
        events.push({
          titre: event.titre || 'Sans titre',
          texte: event.texte || 'Pas de description',
          date: formattedDate,
          lieu: event.lieu && event.lieu.nom ? event.lieu.nom : 'Lieu non spécifié'
        });
      }
      
      // Sauvegarder les événements au format JSON
      fs.writeFileSync('events.json', JSON.stringify(events, null, 2));
      console.log('Événements extraits et sauvegardés dans events.json');
    } else {
      console.error('Format de réponse API inattendu ou aucun événement trouvé');
    }
  }
  
  // Fermer le navigateur
  await browser.close();
})().catch(error => {
  console.error('Une erreur est survenue:', error);
  process.exit(1);
});