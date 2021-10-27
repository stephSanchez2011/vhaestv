<main>
  <?php

    if(isset($_SESSION['identifiant']))
    {
      ?>
      <h1>Fais toi plaisir mon bro  <?php echo $_SESSION['identifiant']; ?> !</h1>
      <?php
    }else{
      ?>
        <h1>Rejoins nous sur twitch mon fréro !</h1>
      <?php
    }
  ?>
  <p class='get-me'>Profite de ce site pour te renseigner sur moi et me contacter !</p>
</main>