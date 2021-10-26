<?php
  /** Menu Name **/
  $instaName = "_stef_sanchez_";
  $twitterName = "twitch_Vhaes";
  $twitchName = "vhaes";

  /** Menu Link **/
  $instaLink = "https://www.instagram.com/_stef_sanchez_/";
  $twitterLink = "https://twitter.com/twitch_Vhaes";
  $twitchLink = "http://twitch.tv/vhaes";
?>

<footer>
  <div class='flex insta'>
    <img src='assets/img/insta.png' class='social'>
    <a href="<?php echo($instaLink) ?>"><?php echo($instaName) ?></a>
  </div>
  <div class='flex twitter'>
    <img src='assets/img/twitter.png' class='social'>
    <a href="<?php echo($twitterLink) ?>"><?php echo($twitterName) ?></a>
  </div>
  <div class='flex twitch'>
    <img src='assets/img/twitch.png' class='social'>
    <a href="<?php echo($twitchLink) ?>"><?php echo($twitchName) ?></a>
  </div>
</footer>