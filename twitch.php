<!DOCTYPE html>
<html lang="fr">
  <?php include("head.php");  ?>
  <body>
    <?php include("menu.php");  ?>
    <main>
      <h1>Bienvenue sur twitch les fréros !</h1>
      <p class='get-me'>Ici tu peux profiter du stream de ton streamer favori sans aucun soucis !</p>
      <!-- Load the Twitch embed script -->
      <div id='iframe'>
        <iframe src="https://player.twitch.tv/?channel=vhaes&parent=localhost&muted=true" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>
      </div>
    </main>
    <?php include("footer.php");  ?>
  </body>
</html>