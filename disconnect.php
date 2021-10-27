<?php 
	session_start();  
	//session_destroy sert à detruire la session  
	session_destroy();  
	header('Location: home.php');
?>
