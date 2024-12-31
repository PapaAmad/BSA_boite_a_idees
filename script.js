document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('ideaForm');
    const personalInfo = document.querySelector('.personal-info');
    const radioButtons = document.querySelectorAll('input[name="anonymity"]');
  
    // -------------------------------
    // 1. CONFIGURATION JSONBin
    // -------------------------------
    const JSONBIN_API_KEY = '$2a$10$X.WWP2aW9VzSkv3T5yKrJu2H8hgIVq4YyeKsthJYG.eicaQ07qXnC';  
    const JSONBIN_BIN_ID  = '67733c15acd3cb34a8c1d9b6';   
    const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
  
  
    // -------------------------------
    // 2. CONFIGURATION FORMSPREE
    // -------------------------------
    const FORMSPREE_URL = 'https://formspree.io/f/mkggvrlz';
  
    // -------------------------------
    // 3. AFFICHER MASQUER personalInfo
    // -------------------------------
    radioButtons.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === 'identified') {
          personalInfo.style.display = 'block';
        } else {
          personalInfo.style.display = 'none';
        }
      });
    });
  
    // -------------------------------
    // 4. FONCTION - AJOUTER UNE IDEE DANS JSONBin
    //    (on récupère la liste existante, on push la nouvelle idée, puis on PUT)
    // -------------------------------
    async function submitToJSONBin(newIdea) {
      try {
        // 4.1 Récupérer le contenu actuel de JSONBin (GET)
        const getResponse = await fetch(JSONBIN_URL, {
          method: 'GET',
          headers: {
            'X-Master-Key': JSONBIN_API_KEY
          }
        });
        if (!getResponse.ok) {
          throw new Error('Erreur lors de la récupération des données JSONBin');
        }
        const getResult = await getResponse.json();
  
        // On suppose que getResult.record est un tableau (ex: [])
        const existingIdeas = getResult.record; 
  
        // 4.2 On ajoute la nouvelle idée
        existingIdeas.push(newIdea);
  
        // 4.3 On remet à jour le BIN (PUT)
        const putResponse = await fetch(JSONBIN_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_API_KEY
          },
          body: JSON.stringify(existingIdeas)
        });
        if (!putResponse.ok) {
          throw new Error('Erreur lors de la mise à jour de JSONBin');
        }
  
        const putResult = await putResponse.json();
        return putResult;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  
    // -------------------------------
    // 5. FONCTION - ENVOYER UN EMAIL VIA FORMSPREE
    //    On construit un FormData en se basant sur la nouvelle idée
    // -------------------------------
    async function sendToFormspree(ideaData) {
      // FormData pour Formspree
      const formData = new FormData();
      // Champs "techniques"
      formData.append('_captcha', 'false'); // Désactive le captcha (si plan gratuit)
      // Champs "personnels" (variables envoyées par email)
      formData.append('idea', ideaData.idea);
      formData.append('timestamp', ideaData.timestamp);
  
      if (!ideaData.isAnonymous) {
        formData.append('firstName', ideaData.firstName);
        formData.append('lastName', ideaData.lastName);
        formData.append('email', ideaData.email);
      } else {
        formData.append('firstName', 'Anonyme');
        formData.append('lastName', 'Anonyme');
        // formData.append('email', 'Aucun');
      }
  
      // Envoi de la requête POST à Formspree
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi à Formspree');
      }
      return await response.json();
    }
  
    // -------------------------------
    // 6. VALIDATION D'ADRESSE EMAIL
    // -------------------------------
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    // -------------------------------
    // 7. GESTION DU SUBMIT
    // -------------------------------
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
  
      // Récupération des valeurs
      const idea = document.getElementById('idea').value.trim();
      const anonymityValue = document.querySelector('input[name="anonymity"]:checked').value;
      const isAnonymous = anonymityValue === 'anonymous';
  
      // Vérif : champ "idée"
      if (!idea) {
        alert('Veuillez saisir votre idée avant de soumettre.');
        return;
      }
  
      // Préparation de l'objet qu'on va enregistrer
      let submissionData = {
        idea: idea,
        timestamp: new Date().toISOString(),
        isAnonymous: isAnonymous
      };
  
      // Si l'utilisateur s'identifie, on vérifie ses champs
      if (!isAnonymous) {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName  = document.getElementById('lastName').value.trim();
        const email     = document.getElementById('email').value.trim();
  
        if (!firstName || !lastName || !email) {
          alert('Veuillez remplir tous les champs (Prénom, Nom, Email).');
          return;
        }
        if (!isValidEmail(email)) {
          alert('Veuillez saisir une adresse email valide.');
          return;
        }
  
        submissionData.firstName = firstName;
        submissionData.lastName  = lastName;
        submissionData.email     = email;
      }
  
      try {
        // 7.1 Enregistrer l'idée dans JSONBin
        await submitToJSONBin(submissionData);
  
        // 7.2 Envoyer un email via Formspree
        await sendToFormspree(submissionData);
  
        // 7.3 Si tout est ok
        alert('Merci ! Votre idée a été soumise avec succés.');
        form.reset();
        personalInfo.style.display = 'none';
  
      } catch (error) {
        console.error(error);
        alert('Une erreur est survenue lors de la soumission. Veuillez réessayer.');
      }
    });
  });
  