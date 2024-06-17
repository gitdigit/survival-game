
  // Ajoutez un gestionnaire d'événements au chargement du DOM
  document.addEventListener('DOMContentLoaded', function() {
    // Récupérer le bouton "Start"
    var startButton = document.getElementById('btnstart');

    // Ajouter un événement de clic au bouton "Start"
    startButton.addEventListener('click', function() {
        // Rediriger vers la page du jeu avec le paramètre start=true
        window.location.href = 'game.html?start=true';
    });
});