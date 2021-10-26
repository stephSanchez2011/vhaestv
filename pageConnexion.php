<?php 
include("head.php");

require_once("connexion/configDatabase.php");

if (isset($_POST['forconnect']))
{
	$idconnect = $_POST['idconnect'];
	$passwordconnect = $_POST['passwordconnect'];

// Vérification des identifiants
	$req = $bdd->prepare('SELECT id FROM membre WHERE identifiant = :identifiant AND password = :password');;
	
	$req->execute(array
	    ("identifiant" => $idconnect,
	    "password" => $passwordconnect));

	$resultat = $req->fetch();

    if (!$resultat)
	{
	    $badConnect = 'Mauvais identifiant ou mot de passe !';
	}
	else
	{
		session_start();
		$_SESSION['id'] = $resultat['id'];
		$_SESSION['identifiant'] = $idconnect;
		setcookie(
			'LOGGED_USER',
			$_SESSION['identifiant'],
			[
				'expires' => time() + 365*24*3600,
				'secure' => true,
				'httponly' => true,
			]
		);
		echo 'Vous êtes connecté !';
		header('Location: home.php');
        include("");
	}
}
?>

<body>
	<?php 
		include("connexion.php");
	?>
</body>