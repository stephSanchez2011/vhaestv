<?php //j'ouvre l'acces a la bdd
	try{
	    $bdd = new PDO('mysql:host=localhost;dbname=connexion;charset=utf8', 'root', '');
	    $bdd->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	}
	catch(Exception $e){
	    die('Erreur : '.$e->getMessage());
	}
?>