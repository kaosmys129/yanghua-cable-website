<?php
// Load WordPress environment
require_once('wp-load.php');

echo "--- WordPress Import Diagnostic Script ---\n\n";

// 1. File Path and Accessibility Check
$file_path = '/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/public/data/projects_complete_content.json';
echo "[File Check]\n";
echo "Path: " . $file_path . "\n";
if (file_exists($file_path)) {
    echo "File Exists: Yes\n";
    if (is_readable($file_path)) {
        echo "File Readable: Yes\n";
    } else {
        echo "File Readable: No - PERMISSION ISSUE!\n";
    }
} else {
    echo "File Exists: No - PATH ISSUE!\n";
}
echo "\n";

// 2. File Content and Encoding Check
echo "[Content/Encoding Check]\n";
$content = file_get_contents($file_path);
if ($content === false) {
    echo "Could not read file content.\n";
} else {
    echo "File content read successfully (" . strlen($content) . " bytes).\n";
    if (mb_check_encoding($content, 'UTF-8')) {
        echo "Encoding appears to be UTF-8: Yes\n";
    } else {
        echo "Encoding appears to be UTF-8: No - ENCODING ISSUE!\n";
    }

    // 3. JSON Validity Check
    echo "\n[JSON Validity Check]\n";
    $data = json_decode($content, true);
    $json_error_code = json_last_error();
    if ($json_error_code === JSON_ERROR_NONE) {
        echo "JSON is valid: Yes\n";
        if (isset($data['projects']) && is_array($data['projects'])) {
            echo "Root 'projects' array found: Yes. Contains " . count($data['projects']) . " items.\n";
        } else {
            echo "Root 'projects' array found: No - JSON STRUCTURE ISSUE!\n";
        }
    } else {
        echo "JSON is valid: No - SYNTAX ISSUE!\n";
        echo "JSON Error: " . json_last_error_msg() . " (Code: " . $json_error_code . ")\n";
    }
}
echo "\n";

// 4. User Permissions Check
echo "[WordPress User Check]\n";
if (is_user_logged_in()) {
    $current_user = wp_get_current_user();
    echo "Script is running as a logged-in user.\n";
    echo "User: " . $current_user->user_login . " (ID: " . $current_user->ID . ")\n";
    if (user_can($current_user, 'manage_options')) {
        echo "User has 'manage_options' capability (Administrator): Yes\n";
    } else {
        echo "User has 'manage_options' capability (Administrator): No - INSUFFICIENT PERMISSIONS!\n";
    }
} else {
    // This will be the case when run from CLI, the user is the server user (_www, www-data, etc.)
    echo "Script is running via CLI or is not authenticated.\n";
    echo "Server User: " . get_current_user() . "\n";
}
echo "\n";


// 5. PHP Configuration Check
echo "[PHP Configuration Check]\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Memory Limit: " . ini_get('memory_limit') . "\n";
echo "Max Execution Time: " . ini_get('max_execution_time') . " seconds\n";
echo "Post Max Size: " . ini_get('post_max_size') . "\n";
echo "Upload Max Filesize: " . ini_get('upload_max_filesize') . "\n";
echo "\n";

// 6. ACF Plugin Check
echo "[ACF Plugin Check]\n";
if (class_exists('ACF')) {
    echo "ACF Plugin is active: Yes\n";
    
    $version = 'Unknown';
    if (defined('ACF_VERSION')) {
        $version = ACF_VERSION;
    }

    $is_pro = false;
    if (defined('ACF_PRO')) {
        $is_pro = constant('ACF_PRO');
    }

    if ($is_pro) {
        echo "ACF Version: Pro " . $version . "\n";
    } else {
        echo "ACF Version: Free " . $version . "\n";
    }
} else {
    echo "ACF Plugin is active: No - PLUGIN NOT ACTIVE!\n";
}

echo "--- Diagnostic Complete --- \n";
?>