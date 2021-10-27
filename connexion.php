<!--Formulaire -->

<div id='form' align="center">
	<h1>Connectez-vous</h1>
	<form action="pageConnexion.php" method="POST">
		<input type="text" id='id' placeholder="Identifiant.." name="idconnect">
		<input type="password" id='password' placeholder="Mot de passe.." name="passwordconnect">
		<input type="checkbox" id='keepsession' name="keepsession">Se souvenir de moi
		<input type="submit" id='validate' name="forconnect" value="VALIDER">
	</form>
	<p>
		<?php
			if(isset($badConnect)){
				echo($badConnect);
			}
			else { echo "<script> console.log('wait for connect')</script>"; }
		?>
	</p>
</div>
