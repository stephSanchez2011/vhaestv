<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>Ajout Apprenants</title>
		<link rel="stylesheet" type="text/css" href="style.css">
	</head>
	<body>
		<h1>Ajout Apprenants</h1>
		<div class="form">
			<form method="post" action="admin.php?site=AixMarseille" enctype="multipart/form-data">
			     <label for="titre">Prénom: </label>
			     <input type="text" name="prenom" value="" id="titre" placeholder="Prénom..." /><br />
			     <label for="titre">Nom: </label>
			     <input type="text" name="nom" value="" id="titre" placeholder="Nom..."/><br />
			     <label for="titre">Session: </label>
			     <input type="hidden" name="traitement" value="inscription"/>
			     <input type="hidden" name="site" value="AixMarseille"/>

			<!-- BUILD SELECT MENU -->
			<select name="session">
			     <option value="Marseille Mai 2017">Marseille Mai 2017</option>
			     <option value="Marseille Janvier 2017">Marseille Janvier 2017</option>
			     <option value="Marseille Septembre 2016">Marseille Septembre 2016</option>
			     <option value="Aix Décembre 2016">Aix Décembre 2016</option>
			     <option value="Marseille Sept 2017">Marseille Sept 2017</option>
			     <option value="Team">Team</option>
			</select> 

			     <label for="titre"> OU </label>
			     <input type="text" name="newsession" value="" id="titre" placeholder="Nouvelle Session..."/><br />
			     <label for="titre">Email : </label>
			     <input type="text" name="email" value="" id="titre" placeholder="Email..."/><br />
			     <label for="mon_fichier"> Photo (.jpg ou .jpeg < 500Ko) </label>
			     <input type="hidden" name="MAX_FILE_SIZE" value="500000" /><br />
			     <input type="file" name="mon_fichier" id="mon_fichier" /><br />
			     <label for="mon_fichier">C.V. (.pdf < 1Mo)</label>
			     <input type="hidden" name="MAX_FILE_SIZE" value="1000000" /><br />
			     <input type="file" name="mon_CV" id="mon_CV" /><br />
			    

			     <input type="submit" name="submit" value="Envoyer" /><br />
			</form>
		</div>
	</body>
</html>