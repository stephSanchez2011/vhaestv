<?php
  /** Menu Name **/
  $menuOneName = "Accueil";
  $menuTwoName = "Twitch";
  $menuThreeName = "Mon Compte";
  $menuFourName = "Me connecter";

  /** Menu Link **/
  $menuLogo = "assets/img/logo.png";
  $menuOneLink = "home.php";
  $menuTwoLink = "twitch.php";
  $menuThreeLink = "pageConnexion.php";
  $menuFourLink = "pageConnexion.php";
?>

<header>
    <nav class="main-nav" role="navigation">
        <ul class='menu'>
          <li class="flex-logo"><img src="<?php echo($menuLogo) ?>" id="menu-logo"></li>
          <li><a href="<?php echo($menuOneLink) ?>"><?php echo($menuOneName) ?></a></li>
          <li><a href="<?php echo($menuTwoLink) ?>" ><?php echo($menuTwoName) ?></a></li>
          <?php
            if(isset($_COOKIE['LOGGED_USER']))
            {
              ?>
              <li><a href="<?php echo($menuThreeLink) ?>" ><?php echo($menuThreeName) ?></a></li>
              <?php
            }else{ 
              ?>
              <li><a href="<?php echo($menuFourLink) ?>" ><?php echo($menuFourName) ?></a></li>
              <?php
            }
          ?>
        </ul>
      </nav>
</header>