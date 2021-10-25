<?php
  /** Menu Name **/
  $menuOneName = "Accueil";
  $menuTwoName = "Twitch";
  $menuThreeName = "Me contacter";

  /** Menu Link **/
  $menuLogo = "assets/img/logo.png";
  $menuOneLink = "pages/home.php";
  $menuTwoLink = "pages/home.php";
  $menuThreeLink = "pages/home.php";
?>

<header>
    <nav class="main-nav" role="navigation">
        <ul class='menu'>
          <li class="flex-logo"><img src="<?php echo($menuLogo) ?>" id="menu-logo"></li>
          <li class='flex-nav'><a href="<?php echo($menuOneLink) ?>"><?php echo($menuOneName) ?></a></li>
          <li class='flex-nav'><a href="<?php echo($menuTwoLink) ?>" ><?php echo($menuTwoName) ?></a></li>
          <li class='flex-nav'><a href="<?php echo($menuThreeLink) ?>" ><?php echo($menuThreeName) ?></a></li>
        </ul>
      </nav>
</header>