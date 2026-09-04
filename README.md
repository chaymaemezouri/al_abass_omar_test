# Your Voice, Your Future

CONTEXTE DU PROJET

Créer un site web (landing page + chatbot intégré) pour la campagne 

électorale d'un parti/candidat politique marocain, en vue des élections 

législatives 2026 au Maroc. Le site doit présenter le programme électoral 

et permettre aux visiteurs de poser des questions à un assistant IA qui 

répond exclusivement à partir du contenu officiel du programme.

LANGUES

- Site web: bilingue FR / AR avec bouton de switch (drapeau ou "FR | عربي")

  - Layout LTR en français, RTL en arabe (inversion complète de la mise 

    en page, pas juste le texte)

- Chatbot: trilingue et adaptatif

  - Comprend et répond en Français, Arabe standard (fusha), et Darija 

    marocaine (écrite en caractères arabes ou en arabizi/chiffres-lettres)

  - Détecte automatiquement la langue/registre du message utilisateur et 

    répond dans le même registre

  - Répond UNIQUEMENT à partir du programme électoral fourni (aucune 

    invention, aucun sujet hors-programme)

STYLE VISUEL

- Palette: dégradé de bleus — bleu marine profond (#0A2647), bleu roi 

  (#144272), bleu électrique (#205295), bleu ciel clair (#2C74B3) 

  + fond blanc/gris très clair (#F5F7FA)

- Ton: institutionnel, moderne, sobre, "classe" — pas de couleurs criardes, 

  pas de design kitsch de campagne amateur

- Typographie: police moderne sans-serif supportant nativement l'arabe et 

  le français (ex: Cairo, Tajawal, ou Inter/Poppins pour le FR), titres 

  en gras, excellente lisibilité

- Animations: transitions douces au scroll et au hover, rien d'agressif

- 100% responsive, mobile-first

STRUCTURE DU SITE

1. HERO / PAGE D'ACCUEIL

   - Portrait du candidat en évidence (image à intégrer, placeholder 

     professionnel en attendant)

   - Nom du candidat / du parti en grand

   - Slogan fort tiré du programme (ex: "إنتاج الثروة والسيادة الاقتصادية")

   - Accroche en 1-2 lignes résumant la vision

   - Deux boutons CTA: "اكتشف البرنامج" (Découvrir le programme) et 

     "تحدث مع المساعد" (Parler à l'assistant)

2. MENU / NAVIGATION PRINCIPALE

   - Cards ou boutons visuels vers les sections clés:

     • البرنامج الانتخابي (Le programme)

     • من نحن (À propos / Qui sommes-nous)

     • المحاور الأساسية (Axes prioritaires — économie, gouvernance, 

       digitalisation, PME...)

     • تواصل معنا (Contact)

     • اسأل المساعد (Chatbot)

   - Icônes modernes cohérentes, effet hover élégant

3. SECTION PROGRAMME

   - Présentation structurée par thématiques/axes (basé sur le contenu 

     réel du programme fourni: production de richesse, souveraineté 

     économique, digitalisation de l'administration, soutien aux PME, 

     économie informelle, investissement...)

   - Format aéré: titres d'axes, points-clés en listes ou cards, chiffres 

     clés mis en avant visuellement (ex: 100%, 30%, 2030...)

4. CHATBOT (fonctionnalité centrale)

   - Interface de chat classique, accessible via bouton flottant ou 

     section dédiée

   - Bulles utilisateur / assistant bien différenciées, adaptées au sens 

     RTL/LTR selon la langue active

   - Header du chat: logo/nom du parti + statut "متصل" / "En ligne"

   - Zone de saisie en bas avec bouton d'envoi

   - Chips de questions suggérées cliquables (ex: "شنو هو البرنامج ديال 

     الاقتصاد؟", "Quelles mesures pour les PME ?")

   - Réponses générées à partir du programme injecté en contexte 

     (system prompt), avec ton respectueux, clair, jamais hors-sujet

CONTENU SOURCE

Le programme électoral officiel (fourni séparément) couvre notamment:

- Production de richesse et souveraineté économique

- Transformation digitale de l'administration publique

- Soutien et digitalisation des PME/TPE

- Lutte contre l'économie informelle et intégration progressive

- Vigilance numérique, gouvernance, lutte anti-corruption

CONTRAINTES TECHNIQUES

- Le chatbot doit être connecté à un vrai moteur IA (API) avec le 

  programme complet injecté en system prompt, pour des réponses 

  naturelles en FR/AR/Darija plutôt que des réponses figées par mot-clé

- Prévoir une structure de contenu facilement modifiable (fichier de 

  données séparé) pour ajouter le reste du programme plus tard

- Accessibilité: contrastes suffisants, tailles de police lisibles

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://l-appuy-en-dialogue.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/67315390-c648-48ee-89b0-468ec5372d38).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
