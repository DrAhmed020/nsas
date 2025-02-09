<?php
$action = $_GET['action'] ?? null;
if ($action) {
    include "$action.php";
} else {
    echo json_encode(["error" => "No valid action provided."]);
}
?>