<?php
require 'config.php';

$stmt = $pdo->prepare("SELECT * FROM subscribers");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($rows);
exit;
?>
