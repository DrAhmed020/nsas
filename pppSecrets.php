<?php
//header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/config.php';

use RouterOS\Query;

try {
    // تنفيذ أمر /ppp/secret/print
    $query = new Query('/ppp/secret/print');
    $pppSecrets = $client->query($query)->read();

    // فحص إذا المصفوفة فارغة
    if (empty($pppSecrets)) {
        // ربما المصفوفة فارغة فعليًا أو حساب المستخدم لا يملك صلاحية
        echo json_encode(["success"=>true, "data"=>[], "note"=>"No secrets found or insufficient permission."]);
    } else {
        echo json_encode(["success"=>true, "data"=>$pppSecrets]);
    }
} catch (Exception $e) {
    echo json_encode(["success"=>false, "error"=>$e->getMessage()]);
}
exit;
