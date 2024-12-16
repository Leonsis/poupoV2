<!DOCTYPE html>
<html lang="en">
    <head>
        <?php
            $page = $_GET['page'] ?? 'home';
            $file = "pages/$page.php";
        ?>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- css -->
        <?php include 'estilos.php'; ?>
        <link rel="stylesheet" href="src/css/var.css">

        <!-- Bootstrap -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
        <link rel="icon" href="src/imag/logo2.png">
        <title>Poupo</title>
    </head>
    <body>
        <?php include 'inc/header.php'; ?>
        <main id="site" <?php if($file == "pages/home.php") { ?> style="" <?php } ?>>    
        <?php
            // Define as rotas
            $routes = [
                '/' => 'home.php',
                '/sobre' => 'sobre.php',
            ];

            // Captura a URL atual e remove a base "/portifolio/poupo"
            $request = str_replace('/caioleonni.com/poupo', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

            // Verifica se a rota existe
            if (array_key_exists($request, $routes)) {
                include __DIR__ . '/pages/' . $routes[$request];
            } else {
                // Página 404
                http_response_code(404);
                echo '<h1 class="pageNot">404 - Página não encontrada</h1>';
            }
        ?>

        </main>
        <?php include 'inc/footer.php'?>
        <!-- Bootstrap -->
        <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>    
    </body>
</html>