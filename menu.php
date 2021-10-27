<?php
  if (isset($_SESSION['identifiant']))
  {
    $_SESSION['identifiant'];
  }
  
  /** Menu Name **/
  $menuOneName = "Accueil";
  $menuTwoName = "Twitch";
  $menuThreeName = "Mon Compte";
  $menuFourName = "Me connecter";
  $menuDisconnectName = "Me déconnecter";

  /** Menu Link **/
  $menuLogo = "assets/img/logo.png";
  $menuOneLink = "home.php";
  $menuTwoLink = "twitch.php";
  $menuThreeLink = "myAccount.php";
  $menuFourLink = "pageConnexion.php";
  $menuDisconnectLink = "disconnect.php";

  if(isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on')
    {
      $url = "https";
    }
  else
    {
      $url = "http"; 
    }  
  $url .= "://"; 
  $url .= $_SERVER['HTTP_HOST']; 
  $url .= $_SERVER['REQUEST_URI']; 
  
  
?>

<header>
    <nav class="main-nav" role="navigation">
        <ul class='menu'>
          <li class="flex-logo"><img src="<?php echo($menuLogo) ?>" id="menu-logo"></li>
          <li><a href="<?php echo($menuOneLink) ?>"><?php echo($menuOneName) ?></a></li>
          <li><a href="<?php echo($menuTwoLink) ?>" ><?php echo($menuTwoName) ?></a></li>
          <?php
            
            if(isset( $_SESSION['identifiant']))
            {              
               if ( $url == 'http://localhost/vhaestv/myAccount.php')
                { 
                  ?>
                  <li><a href="<?php echo($menuDisconnectLink) ?>" ><?php echo($menuDisconnectName) ?></a></li>
              <?php
                } else 
                { 
                  ?>
                    <li><a href="<?php echo($menuThreeLink) ?>" ><?php echo($menuThreeName) ?></a></li>
                  <?php
                }
            }
            else{ 
              ?>
              <li><a href="<?php echo($menuFourLink) ?>" ><?php echo($menuFourName) ?></a></li>
              <?php
            }
          ?>
        </ul>
      </nav>
</header>